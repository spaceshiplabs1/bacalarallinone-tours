// cart-api.js — wraps the public REST cart endpoints exposed by the
// travelagencee.com backend. Bridges the React UI's cart shape to the
// API's discriminated-union line items, and hands off to Stripe Checkout.
//
// Companion to data-api.js. Reuses the same window.__TAGC_API__ + tenant-
// host header pattern so a local dev backend can be targeted without code
// changes.

(function () {
  const API =
    window.__TAGC_API__ ||
    "https://backend-production-de7a.up.railway.app";
  const TENANT_HOST =
    window.__TAGC_TENANT_HOST__ || "bacalarallinone-tours.vercel.app";

  // Tours don't link pickup zones (operators don't separate pickup costs).
  // The API still requires a UUID at write-time; the nil UUID passes Zod's
  // format check and signals "no zone".
  const NIL_UUID = "00000000-0000-0000-0000-000000000000";

  // Per-cart state held in module scope: cartId, sessionToken (echoed back
  // by the create response — stored client-side because the cookie is
  // SameSite=lax and won't survive the Stripe round-trip predictably), and
  // the CSRF token needed for PUT + checkout.
  let state = {
    cartId: null,
    sessionToken: null,
    csrfToken: null,
    expiresAt: null,
  };

  function jsonHeaders(extra) {
    return {
      "content-type": "application/json",
      "x-tenant-host": TENANT_HOST,
      ...(extra || {}),
    };
  }

  async function call(method, path, body, extraHeaders) {
    const res = await fetch(`${API}${path}`, {
      method,
      credentials: "include",
      headers: jsonHeaders(extraHeaders),
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let parsed = null;
    try { parsed = text ? JSON.parse(text) : null; } catch (_) { /* leave null */ }
    if (!res.ok) {
      const err = new Error(
        `cart_api ${method} ${path} ${res.status}: ` +
        (parsed?.error || text.slice(0, 200))
      );
      err.status = res.status;
      err.body = parsed;
      throw err;
    }
    return parsed;
  }

  // POST /api/cart — issues sessionToken + csrfToken. Customer fields are
  // optional but we send what we have so the cart row carries them through
  // to the Booking that gets created on Stripe success.
  async function create(customer) {
    const body = {};
    if (customer?.email)  body.customerEmail  = customer.email;
    if (customer?.name)   body.customerName   = customer.name;
    if (customer?.phone)  body.customerPhone  = customer.phone;
    if (customer?.locale) body.customerLocale = customer.locale;
    const data = await call("POST", "/api/cart", body);
    state.cartId       = data.cartId;
    state.sessionToken = data.sessionToken;
    state.csrfToken    = data.csrfToken;
    state.expiresAt    = data.expiresAt;
    return data;
  }

  // PUT /api/cart/:id — replaces the items array in one call. The schema
  // requires unitPrice/lineTotal in cents, currency in {USD,MXN}, and a
  // typed `details` payload. We accept a simpler local shape (the UI's
  // cart-line shape) and translate.
  async function setItems(uiItems) {
    if (!state.cartId) throw new Error("cart_not_created");
    const items = uiItems.map(toApiItem);
    return call(
      "PUT",
      `/api/cart/${encodeURIComponent(state.cartId)}`,
      { items },
      { "x-csrf-token": state.csrfToken },
    );
  }

  // POST /api/cart/:id/checkout — backend turns the cart into a Stripe
  // Checkout Session and returns the redirect URL. successUrl/cancelUrl
  // are sent in the body so the per-tenant site controls the return path
  // (backend currently reads STRIPE_SUCCESS_URL env; a small additive
  // patch on the backend will start preferring these body fields).
  async function checkout(opts) {
    if (!state.cartId) throw new Error("cart_not_created");
    const body = {};
    if (opts?.successUrl) body.successUrl = opts.successUrl;
    if (opts?.cancelUrl)  body.cancelUrl  = opts.cancelUrl;
    return call(
      "POST",
      `/api/cart/${encodeURIComponent(state.cartId)}/checkout`,
      body,
      { "x-csrf-token": state.csrfToken },
    );
  }

  // ---- shape translation: UI cart-line → API cart-item ----
  // Handles two line shapes:
  //   tour line:     { tourId (slug), date, time, adults, kids, pickup?, subtotal }
  //   transfer line: { kind: 'transfer', subtotal, currency, transfer:{...} }
  // The `kind` discriminator on the transfer shape is the only thing
  // distinguishing them; tour lines stay backwards-compatible (no kind).
  function toApiItem(line) {
    if (line.kind === "transfer") return toApiTransferItem(line);
    return toApiTourItem(line);
  }

  function toApiTourItem(line) {
    const tour = (window.TOURS || []).find((x) => x.id === line.tourId || x.slug === line.tourId);
    if (!tour) throw new Error(`cart_api unknown tour: ${line.tourId}`);
    if (!tour.apiId) throw new Error(`cart_api tour missing apiId: ${tour.slug}`);
    const currency = tour.defaultCurrency || "USD";
    const subtotalCents = Math.max(0, Math.round(Number(line.subtotal) * 100));
    const passengers = {};
    if (line.adults != null) passengers.adult = Number(line.adults) || 0;
    if (line.kids   != null) passengers.child = Number(line.kids)   || 0;
    const titleEn = (tour.title && (tour.title.en || tour.title.es)) || tour.slug;
    const description = `${titleEn} · ${line.date} ${line.time}`.slice(0, 500);
    return {
      type: "tour",
      description,
      qty: 1,
      unitPrice: subtotalCents,
      lineTotal: subtotalCents,
      currency,
      details: {
        tourId: tour.apiId,
        pickupZoneId: line.pickup?.zoneId || tour.pickupZones?.[0]?.id || NIL_UUID,
        scheduledDate: new Date(`${line.date}T00:00:00Z`).toISOString(),
        scheduledTime: line.time,
        passengers,
        ...(line.specialRequests ? { specialRequests: line.specialRequests } : {}),
      },
    };
  }

  // Transfer line shape (composed by pages/transfers.jsx after a quote
  // succeeds): {
  //   kind: 'transfer',
  //   serviceType, // 'arrival' | 'departure' | 'round_trip' | 'point_to_point'
  //   origin: { address, lat, lng },
  //   destination: { address, lat, lng },
  //   pax, luggage,
  //   vehicleId, vehicleName,
  //   routePriceId,                 // echoed from quote response → drives vendor copy
  //   roundTrip: bool,
  //   addons: [{addonId, code, qty, unitPrice}],
  //   currency, subtotal,           // dollars; total INCL addons + RT logic
  //   flightInfo?,                  // freeform string
  // }
  function toApiTransferItem(line) {
    const t = line;
    const currency = t.currency || "USD";
    const subtotalCents = Math.max(0, Math.round(Number(t.subtotal) * 100));
    const direction = t.roundTrip ? "Round-trip" : "One-way";
    const where = `${t.origin?.address || "pickup"} → ${t.destination?.address || "dropoff"}`;
    const description = `${direction} transfer · ${t.vehicleName || "van"} · ${where}`
      .slice(0, 500);
    const apiAddons = (t.addons || [])
      .filter((a) => a.addonId)
      .map((a) => ({
        addonId: a.addonId,
        qty: Number(a.qty) || 1,
        unitPrice: Math.max(0, Math.round(Number(a.unitPrice) * 100)),
      }));
    return {
      type: "shuttle_transfer",
      description,
      qty: 1,
      unitPrice: subtotalCents,
      lineTotal: subtotalCents,
      currency,
      details: {
        serviceType: t.serviceType || "point_to_point",
        origin: {
          address: t.origin?.address || undefined,
          lat: Number(t.origin.lat),
          lng: Number(t.origin.lng),
        },
        destination: {
          address: t.destination?.address || undefined,
          lat: Number(t.destination.lat),
          lng: Number(t.destination.lng),
        },
        pax: Number(t.pax) || 1,
        luggage: Number(t.luggage) || 0,
        vehicleId: t.vehicleId,
        ...(t.routePriceId ? { routePriceId: t.routePriceId } : {}),
        addons: apiAddons,
        ...(t.flightInfo ? { flightInfo: String(t.flightInfo).slice(0, 500) } : {}),
      },
    };
  }

  // Convenience: full one-shot flow used by booking.jsx — create cart,
  // set items, kick off checkout, redirect to Stripe.
  async function submitAndRedirect({ customer, items, successUrl, cancelUrl }) {
    await create(customer);
    await setItems(items);
    const { checkoutUrl } = await checkout({ successUrl, cancelUrl });
    if (!checkoutUrl) throw new Error("cart_api missing_checkout_url");
    window.location.href = checkoutUrl;
  }

  window.tagcCart = {
    create,
    setItems,
    checkout,
    submitAndRedirect,
    getState: () => ({ ...state }),
  };
})();
