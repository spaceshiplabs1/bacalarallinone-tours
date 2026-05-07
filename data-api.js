// data-api.js — replaces the static data.js with live data from the
// travelagencee.com backend. Designed so the existing components keep
// working unchanged: we shape the API response into the same fields the
// previous static catalog exposed via window.TOURS.
//
// Override the API base URL at runtime by setting window.__TAGC_API__
// before this script runs (or via a query param if you want to test
// against a local backend).

(function () {
  const API =
    window.__TAGC_API__ ||
    "https://backend-production-de7a.up.railway.app";

  // When running against a deployed bacalarallinone-tours.vercel.app or
  // bacalarallinone.tours, the backend resolves the tenant from the request
  // `Host` header automatically. But on a local dev server (or any non-
  // registered host) the backend can't tell which tenant we're representing
  // — it returns 404 tenant_not_found. Send `x-tenant-host` so the API
  // always knows which agency this site is.
  const TENANT_HOST =
    window.__TAGC_TENANT_HOST__ || "bacalarallinone-tours.vercel.app";

  const API_HEADERS = { "x-tenant-host": TENANT_HOST };

  // Synchronous placeholder so components that render before the fetch
  // resolves (e.g. detail page on a deep-link refresh) get a complete tour
  // shape from window.TOURS[0] / .find(...) instead of `undefined`. The
  // placeholder gets replaced as soon as loadCatalog() resolves and we
  // dispatch __routechange.
  const PLACEHOLDER_TOUR = {
    id: "__loading__",
    slug: "__loading__",
    title: { en: "Loading…", es: "Cargando…" },
    tagline: { en: "", es: "" },
    category: "lagoon",
    audience: ["regular"],
    location: "",
    duration: 0,
    priceAdult: 0,
    priceKid: 0,
    rating: 0,
    reviews: 0,
    tags: [],
    includes: [],
    times: [],
    color: "lagoon",
    phLabel: "LOADING",
    pickupPoints: [
      { label: { en: "", es: "" }, surcharge: 0, etaMin: 0 },
    ],
    flat: false,
    coverUrl: null,
    _gallery: [],
    _detailLoaded: false,
  };
  window.TOURS = [PLACEHOLDER_TOUR];

  // Static editorial content kept on the front-end for now (the API doesn't
  // expose reviews or the territory-map pins yet).
  window.REVIEWS = [
    { tour: "bacalar-sailboat-sunset", name: "Marta G.", flag: "🇪🇸", rating: 5, date: "Mar 2026", body: { en: "Captain Beto was the soul of the trip. The water really is seven colors — photos don't lie.", es: "El capitán Beto fue el alma del viaje. El agua es realmente de siete colores." } },
    { tour: "bacalar-sailboat-sunset", name: "James T.", flag: "🇺🇸", rating: 5, date: "Feb 2026", body: { en: "Booked day-of via WhatsApp, they picked us up at our hotel 20 min later. Unreal.", es: "Reservé el mismo día por WhatsApp, nos recogieron en 20 min." } },
    { tour: "chacchoben-ruins-mahahual", name: "Linda P.", flag: "🇺🇸", rating: 5, date: "Apr 2026", body: { en: "Our ship was Carnival Horizon. We were back at the pier with 90 min to spare and felt zero stress.", es: "Nuestro barco era Carnival Horizon. Volvimos al muelle con 90 min de sobra, cero estrés." } },
    { tour: "atv-jungle-cenote", name: "Kai S.", flag: "🇩🇪", rating: 5, date: "Mar 2026", body: { en: "Muddy, fast, incredible. The cenote at the end was freezing and perfect.", es: "Lodoso, rápido, increíble. El cenote al final estaba helado y perfecto." } },
    { tour: "pontoon-piratas-rapidos-cocalitos", name: "Sofía M.", flag: "🇲🇽", rating: 5, date: "Feb 2026", body: { en: "El pontón privado fue el highlight de nuestra luna de miel. El ceviche, divino.", es: "El pontón privado fue el highlight de nuestra luna de miel. El ceviche, divino." } },
    { tour: "muyil-sian-kaan-floating-canals", name: "Elena R.", flag: "🇲🇽", rating: 5, date: "Apr 2026", body: { en: "Flotar por el canal con el sonido de la selva fue meditativo. Lo mejor del viaje.", es: "Flotar por el canal con el sonido de la selva fue meditativo. Lo mejor del viaje." } },
    { tour: "ichkabal-new-mayan-ruins", name: "Ben H.", flag: "🇬🇧", rating: 5, date: "Mar 2026", body: { en: "Being on top of a freshly-uncovered pyramid with no one around is surreal. Go before the crowds find it.", es: "Estar en una pirámide recién descubierta, sin nadie, es surreal. Ve antes de que la encuentren." } },
  ];

  window.MAP_PINS = [
    { id: "bacalar",    name: "Bacalar",       x: 41.79, y: 70.87, count: 7, label: { en: "Lagoon Tours",        es: "Tours Laguna"          } },
    { id: "mahahual",   name: "Mahahual",      x: 60.87, y: 75.02, count: 5, label: { en: "Port · Beach · ATV",   es: "Puerto · Playa · ATV" } },
    { id: "chacchoben", name: "Chacchoben",    x: 51.92, y: 66.89, count: 1, label: { en: "Mayan Ruins",          es: "Ruinas Mayas"         } },
    { id: "kohunlich",  name: "Kohunlich",     x: 25.83, y: 88.35, count: 1, label: { en: "Temple of Masks",      es: "Templo Mascarones"    } },
    { id: "ichkabal",   name: "Ichkabal",      x: 47.50, y: 80.04, count: 1, label: { en: "New ruins (2024)",     es: "Ruinas nuevas (2024)" } },
    { id: "dzibanche",  name: "Dzibanché",     x: 29.98, y: 78.31, count: 1, label: { en: "Twin pyramids",         es: "Pirámides gemelas"   } },
    { id: "muyil",      name: "Muyil",         x: 51.14, y: 52.35, count: 1, label: { en: "Sian Ka'an floats",     es: "Canales Sian Ka'an"  } },
    { id: "tulum",      name: "Tulum",         x: 60.09, y: 32.62, count: 2, label: { en: "Ruins + TQO Airport",  es: "Ruinas + Aeropuerto"  } },
    { id: "cancun",     name: "Cancún",        x: 69.18, y:  9.09, count: 2, label: { en: "CUN Airport",          es: "Aeropuerto CUN"       } },
    { id: "chichen",    name: "Chichén Itzá",  x: 30.50, y: 21.03, count: 2, label: { en: "World Wonder",         es: "Maravilla"            } },
  ];

  function parseInclusionsHtml(html) {
    if (!html) return [];
    const matches = html.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
    return matches
      .map((m) => m.replace(/<[^>]*>/g, "").trim())
      .filter(Boolean);
  }

  function audienceFromTags(tags) {
    const slugs = tags.map((t) => (typeof t === "string" ? t : t.slug));
    return slugs.includes("port-friendly")
      ? ["port", "regular"]
      : ["regular"];
  }

  // Map our category slug → the existing site's color token.
  const COLOR_BY_CATEGORY = {
    lagoon: "lagoon",
    ruins: "clay",
    "mayan-ruins": "clay",
    adventure: "jungle",
    beach: "sun",
    ocean: "deep",
    transfer: "jungle",
    sailboat: "lagoon",
    "motor-boat": "lagoon",
    "paddle-kayak": "lagoon",
    "water-activities": "lagoon",
    snorkel: "deep",
    cenotes: "deep",
    cultural: "clay",
    atv: "jungle",
    "zip-line": "jungle",
  };

  // Display category — what the catalog filter chips match against.
  // Sailing / paddle / motor-boat tours all live on Bacalar's lagoon, so
  // they collapse into the "lagoon" filter the user already knows. Keeps
  // the chip set short while making the new daytour imports filterable.
  const DISPLAY_CATEGORY = {
    sailboat: "lagoon",
    "motor-boat": "lagoon",
    "paddle-kayak": "lagoon",
    "water-activities": "lagoon",
    cenotes: "adventure",
    snorkel: "ocean",
    "mayan-ruins": "ruins",
    atv: "adventure",
    "zip-line": "adventure",
    cultural: "ruins",
  };

  // Some Bokun titles ship with a "[NEW]" / "[NEW TOUR]" / "[NEW EXPERIENCE]"
  // prefix in EN, and "[NUEVO]" / "[NUEVO TOUR]" in ES. The two are not
  // always mirrored — Laguna Lumina has the prefix in ES only — so we strip
  // both forms independently and OR the resulting isNew flag, so a single
  // "NUEVO/NEW" badge fires regardless of which translation carries it.
  function stripNewPrefix(name) {
    if (!name) return { name, isNew: false };
    const m = name.match(/^\s*\[\s*(?:NEW|NUEVO|NUEVA)(?:\s+(?:TOUR|EXPERIENCE|ROUTE|EXPERIENCIA|RUTA))?\s*\]\s*/i);
    return m
      ? { name: name.slice(m[0].length).trim(), isNew: true }
      : { name, isNew: false };
  }

  function shapeListItem(en, es) {
    const t = en;
    const e = es || null;
    const enName = stripNewPrefix(t.translation.name);
    const esName = stripNewPrefix(e?.translation?.name ?? t.translation.name);
    return {
      // Existing components find tours by `id`; we use slug as the canonical
      // id since slug is unique per tenant and stable. The real API UUID is
      // exposed as `apiId` for cart line items where details.tourId must be
      // a UUID.
      id: t.slug,
      slug: t.slug,
      apiId: t.id,
      title: {
        en: enName.name,
        es: esName.name,
      },
      isNew: enName.isNew || esName.isNew,
      tagline: {
        en: t.translation.shortDescription || "",
        es:
          e?.translation?.shortDescription ||
          t.translation.shortDescription ||
          "",
      },
      category: DISPLAY_CATEGORY[t.category?.slug] ?? t.category?.slug ?? "lagoon",
      audience: audienceFromTags(t.tags || []),
      location: t.category?.name ?? "",
      duration: Math.max(1, Math.round(t.durationMinutes / 60)),
      durationMinutes: t.durationMinutes,
      // Prefer the default rate's prices (real Bokun figures) over the
      // tour-level basePrice (computed snapshot of the same default rate).
      // For per_booking flat tours the displayed price comes from
      // bookingPriceCents, not adultPriceCents.
      priceAdult: (() => {
        const dr = t.defaultRate;
        if (dr) {
          if (dr.priceUnit === "per_booking") return dr.bookingPriceCents != null ? Math.round(dr.bookingPriceCents / 100) : 0;
          if (dr.adultPriceCents != null) return Math.round(dr.adultPriceCents / 100);
        }
        return t.basePrice ? Math.round(t.basePrice / 100) : 0;
      })(),
      priceKid: (() => {
        const dr = t.defaultRate;
        if (dr && dr.childPriceCents != null) return Math.round(dr.childPriceCents / 100);
        // Fallback: half of adult only when the tour is kid-friendly and we
        // have no real child price. Imported tours always carry the real
        // child figure (often $0 = free), so this fallback only fires for
        // legacy seed rows.
        return t.isKidFriendly && t.basePrice ? Math.round((t.basePrice / 100) * 0.5) : 0;
      })(),
      rating: 4.8,
      reviews: 0,
      tags: (t.tags || []).map((x) => x.slug),
      includes: parseInclusionsHtml(t.translation.inclusionsHtml),
      times: [],
      color: COLOR_BY_CATEGORY[t.category?.slug] ?? "lagoon",
      phLabel: (t.translation.name || "").toUpperCase().slice(0, 32),
      pickupPoints: [
        {
          label: { en: "Default pickup", es: "Pickup principal" },
          surcharge: 0,
          etaMin: 0,
        },
      ],
      coverUrl: t.coverImage?.url ?? null,
      // priceUnit drives the "/persona" vs "/grupo" suffix on the price.
      // `flat` is kept for the transfer flow (vans), where the same flag
      // also gates "per van" rendering. priceUnit takes precedence.
      priceUnit: t.priceUnit || "per_person",
      hasMultipleRates: !!t.hasMultipleRates,
      defaultRate: t.defaultRate || null,
      adultMinAge: t.adultMinAge ?? null,
      adultMaxAge: t.adultMaxAge ?? null,
      childMinAge: t.childMinAge ?? null,
      childMaxAge: t.childMaxAge ?? null,
      flat: t.category?.slug === "transfer",
      _gallery: t.coverImage?.url
        ? [{ src: t.coverImage.url, label: "" }]
        : [],
      // ---- Extended API fields (used by the redesigned detail sections) ----
      difficulty: t.difficulty || "easy",
      minPax: t.minPax ?? 1,
      maxPax: t.maxPax ?? null,
      isFeatured: !!t.isFeatured,
      isVipPrivate: !!t.isVipPrivate,
      defaultCurrency: t.defaultCurrency || "USD",
      // Long-form blocks (filled when ensureDetail() runs).
      descriptionHtml: { en: null, es: null },
      itineraryHtml:   { en: null, es: null },
      exclusionsHtml:  { en: null, es: null },
      termsHtml:       { en: null, es: null },
      metaTitle:       { en: t.translation.metaTitle || null, es: null },
      metaDescription: { en: t.translation.metaDescription || null, es: null },
      // Filled by ensureDetail; default to no-blackouts.
      blackoutDates: [],
      schedules: [],
      pickupZones: [],   // [{id, name, color}]
      zonePrices: [],    // [{zoneId, paxCategory, price, currency}]
      _detailLoaded: false,
    };
  }

  async function loadCatalog() {
    const [enRes, esRes] = await Promise.all([
      fetch(`${API}/api/tours?limit=50&locale=en`, { credentials: "include", headers: API_HEADERS }),
      fetch(`${API}/api/tours?limit=50&locale=es`, { credentials: "include", headers: API_HEADERS }),
    ]);
    if (!enRes.ok) throw new Error(`API list ${enRes.status}`);
    const enList = (await enRes.json()).tours;
    const esList = esRes.ok ? (await esRes.json()).tours : [];
    const esBySlug = Object.fromEntries(esList.map((t) => [t.slug, t]));
    return enList.map((t) => shapeListItem(t, esBySlug[t.slug]));
  }

  // Fetch the resolved agency (branding, default currency, FX rates).
  // Storefront stores the result on window.AGENCY so TourCard / detail can
  // convert prices on the fly when the user toggles USD ↔ MXN. FX rates use
  // multiplier semantics: dst_amount = src_amount * rate.
  async function loadAgency() {
    try {
      const res = await fetch(`${API}/api/agency`, {
        credentials: "include",
        headers: API_HEADERS,
      });
      if (!res.ok) {
        console.warn("[tagc] /api/agency", res.status);
        return null;
      }
      const a = await res.json();
      window.AGENCY = a;
      return a;
    } catch (e) {
      console.warn("[tagc] loadAgency failed", e);
      return null;
    }
  }

  // Convert a price between currencies using the active agency's FX policy.
  // Returns null when no rate is wired for the pair (caller falls back to
  // the source amount + source currency code). Identity case (src===dst)
  // returns the input amount unchanged.
  window.tagcConvertPrice = function (amount, srcCurrency, dstCurrency) {
    if (amount == null || !Number.isFinite(amount)) return null;
    if (!srcCurrency || !dstCurrency) return null;
    if (srcCurrency === dstCurrency) return amount;
    const rates = (window.AGENCY && window.AGENCY.fxRates) || [];
    const r = rates.find(
      (x) => x.fromCurrency === srcCurrency && x.toCurrency === dstCurrency,
    );
    if (!r) return null;
    return amount * r.rate;
  };

  // Fill in detail-only fields (full gallery, schedules, pickup zones,
  // long-form translations) on first navigation to a tour. Caches on the
  // tour object so subsequent reads are free.
  async function ensureDetail(tour) {
    if (!tour || tour._detailLoaded) return tour;
    try {
      const [enRes, esRes] = await Promise.all([
        fetch(`${API}/api/tours/${tour.slug}?locale=en`, {
          credentials: "include",
          headers: API_HEADERS,
        }),
        fetch(`${API}/api/tours/${tour.slug}?locale=es`, {
          credentials: "include",
          headers: API_HEADERS,
        }),
      ]);
      if (enRes.ok) {
        const en = await enRes.json();
        const sched = (en.schedules || []).find((s) => s.isActive !== false);
        tour.times = sched?.startTimes || tour.times;
        tour.schedules = en.schedules || [];
        tour.blackoutDates = en.blackoutDates || [];
        tour.zonePrices = en.zonePrices || [];
        tour.rates = en.rates || [];
        tour.isRequestOnly = !!en.isRequestOnly;
        tour.priceUnit = en.priceUnit || tour.priceUnit;
        tour.adultMinAge = en.adultMinAge ?? tour.adultMinAge;
        tour.adultMaxAge = en.adultMaxAge ?? tour.adultMaxAge;
        tour.childMinAge = en.childMinAge ?? tour.childMinAge;
        tour.childMaxAge = en.childMaxAge ?? tour.childMaxAge;
        if (en.translation?.inclusionsHtml) {
          tour.includes = parseInclusionsHtml(en.translation.inclusionsHtml);
        }
        tour.descriptionHtml.en = en.translation?.descriptionHtml || null;
        tour.itineraryHtml.en   = en.translation?.itineraryHtml   || null;
        tour.exclusionsHtml.en  = en.translation?.exclusionsHtml  || null;
        tour.termsHtml.en       = en.translation?.termsHtml       || null;
        tour.metaTitle.en       = en.translation?.metaTitle       || null;
        tour.metaDescription.en = en.translation?.metaDescription || null;
        tour._gallery = (en.images || []).map((im) => ({
          src: im.url,
          label: "",
        }));
        if (en.pickupZones?.length) {
          tour.pickupZones = en.pickupZones;
          tour.pickupPoints = en.pickupZones.map((z) => ({
            label: { en: z.name, es: z.name },
            surcharge: 0,
            etaMin: 0,
            zoneId: z.id,
          }));
        }
      }
      if (esRes.ok) {
        const es = await esRes.json();
        const cleaned = stripNewPrefix(es.translation?.name);
        tour.title.es = cleaned.name || tour.title.es;
        if (cleaned.isNew) tour.isNew = true;
        tour.tagline.es =
          es.translation?.shortDescription || tour.tagline.es;
        tour.descriptionHtml.es = es.translation?.descriptionHtml || tour.descriptionHtml.es;
        tour.itineraryHtml.es   = es.translation?.itineraryHtml   || tour.itineraryHtml.es;
        tour.exclusionsHtml.es  = es.translation?.exclusionsHtml  || tour.exclusionsHtml.es;
        tour.termsHtml.es       = es.translation?.termsHtml       || tour.termsHtml.es;
        tour.metaTitle.es       = es.translation?.metaTitle       || tour.metaTitle.es;
        tour.metaDescription.es = es.translation?.metaDescription || tour.metaDescription.es;
      }
      tour._detailLoaded = true;
      // Force a re-render so newly-arrived gallery / times / etc. show up.
      // App re-renders on `hashchange` (not __routechange). Dispatching
      // hashchange with the URL unchanged re-runs the route handler and
      // setRoute(parseHash()) returns a fresh object → React re-renders.
      window.dispatchEvent(new Event("hashchange"));
    } catch (e) {
      console.warn("[tagc] tour detail load failed:", tour.slug, e);
    }
    return tour;
  }

  // photos.jsx exports tourPhoto + tourGallery. We override with API-driven
  // versions so existing components don't render local placeholder paths.
  window.tourPhoto = function (tour) {
    if (!tour) return "./images/hero-lagoon.webp";
    return (
      tour.coverUrl ||
      tour._gallery?.[0]?.src ||
      "./images/hero-lagoon.webp"
    );
  };

  window.tourGallery = function (tour) {
    if (!tour) return [];
    if (tour._gallery && tour._gallery.length > 1) return tour._gallery;
    // Kick off detail-load (which populates _gallery and re-renders) but
    // return what we have synchronously to avoid blank UI on first paint.
    if (tour.slug) ensureDetail(tour);
    if (tour._gallery && tour._gallery.length) return tour._gallery;
    if (tour.coverUrl) return [{ src: tour.coverUrl, label: "" }];
    return [];
  };

  window.tagcEnsureDetail = ensureDetail;

  // Initial agency + catalog load. Agency is fetched in parallel — failures
  // there shouldn't block the catalog from rendering.
  loadAgency();

  // Initial catalog load. Re-render the page when ready.
  loadCatalog()
    .then((list) => {
      window.TOURS = list;
      // App re-renders on `hashchange` (not __routechange). Dispatching
      // hashchange with the URL unchanged re-runs the route handler and
      // setRoute(parseHash()) returns a fresh object → React re-renders.
      window.dispatchEvent(new Event("hashchange"));
    })
    .catch((err) => {
      console.error("[tagc] catalog load failed:", err);
    });
})();
