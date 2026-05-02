// Transfers page (real quote engine) + Map page.
//
// The Transfers component drives the full /api/quotes/shuttle/transfer
// flow end-to-end:
//   1. User picks origin + dropoff (chip-quick-select or freeform — Google
//      Places autocomplete will replace the freeform input once the API
//      key lands).
//   2. POST /api/quotes/shuttle/transfer → backend resolves zones from
//      lat/lng and returns vehicle options with vendor + price.
//   3. User picks a vehicle, optional addons, optional flight info.
//   4. Customer info → window.tagcCart.submitAndRedirect → Stripe Checkout.

const API_BASE =
  window.__TAGC_API__ || "https://backend-production-de7a.up.railway.app";
const TENANT_HOST =
  window.__TAGC_TENANT_HOST__ || "bacalarallinone-tours.vercel.app";

// Known pickup/dropoff anchors. lat/lng are inside each zone polygon so
// the backend's findContainingZone resolves them. The user can refine
// these later — they're not the source of truth, just convenience chips.
// When Google Places autocomplete lands, anything the user types resolves
// to lat/lng directly and these chips become a courtesy shortcut.
const TRANSFER_ANCHORS = [
  { id: 'cun',          label: { en: 'Cancún Airport (CUN)', es: 'Aeropuerto Cancún (CUN)' }, lat: 21.0367, lng: -86.8771, isAirport: true },
  { id: 'tqo',          label: { en: 'Tulum Airport (TQO)',  es: 'Aeropuerto Tulum (TQO)'  }, lat: 19.7456, lng: -87.8431, isAirport: true },
  { id: 'ctm',          label: { en: 'Chetumal Airport (CTM)', es: 'Aeropuerto Chetumal (CTM)' }, lat: 18.5038, lng: -88.3282, isAirport: true },
  { id: 'centro',       label: { en: 'Bacalar (Centro)',     es: 'Bacalar (Centro)' },         lat: 18.6778, lng: -88.3962 },
  { id: 'costera',      label: { en: 'Bacalar (Costera)',    es: 'Bacalar (Costera)' },        lat: 18.6778, lng: -88.3892 },
  { id: 'pedro-santos', label: { en: 'Pedro A. Santos',      es: 'Pedro A. Santos' },          lat: 18.6238, lng: -88.4062 },
  { id: 'mahahual',     label: { en: 'Mahahual',             es: 'Mahahual' },                 lat: 18.7118, lng: -87.7162 },
];

const dollarsFromCents = (c) => (Number(c) / 100).toFixed(2);

const Transfers = () => {
  const { t, lang } = useT();

  // ---- form state ----
  const [origin, setOrigin] = useState({ address: '', lat: null, lng: null, anchorId: null });
  const [destination, setDestination] = useState({ address: '', lat: null, lng: null, anchorId: null });
  const [pax, setPax] = useState(2);
  const [luggage, setLuggage] = useState(2);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [roundTrip, setRoundTrip] = useState(false);
  const [flightInfo, setFlightInfo] = useState('');

  // ---- quote state ----
  const [quoteState, setQuoteState] = useState({ status: 'idle', data: null, error: null });
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [selectedAddonIds, setSelectedAddonIds] = useState([]);

  // ---- customer + submit ----
  const [customer, setCustomer] = useState({ email: '', name: '', phone: '' });
  const [submitState, setSubmitState] = useState({ submitting: false, error: null });

  const isAirportInvolved =
    (origin.anchorId && TRANSFER_ANCHORS.find((a) => a.id === origin.anchorId)?.isAirport) ||
    (destination.anchorId && TRANSFER_ANCHORS.find((a) => a.id === destination.anchorId)?.isAirport);

  // Service type mapping. The backend accepts arrival/departure/round_trip/
  // point_to_point; we keep the toggle simple (one-way vs round-trip) and
  // upgrade to arrival/departure when the user clearly intends a flight.
  const serviceType = (() => {
    if (roundTrip) return 'round_trip';
    if (origin.anchorId && TRANSFER_ANCHORS.find((a) => a.id === origin.anchorId)?.isAirport) return 'arrival';
    if (destination.anchorId && TRANSFER_ANCHORS.find((a) => a.id === destination.anchorId)?.isAirport) return 'departure';
    return 'point_to_point';
  })();

  const setEndpointFromAnchor = (which, anchor) => {
    const setter = which === 'origin' ? setOrigin : setDestination;
    setter({
      address: anchor.label[lang] || anchor.label.en,
      lat: anchor.lat,
      lng: anchor.lng,
      anchorId: anchor.id,
    });
  };

  const setEndpointFromText = (which, text) => {
    const setter = which === 'origin' ? setOrigin : setDestination;
    setter((prev) => ({ ...prev, address: text, anchorId: null }));
  };

  // Allow paste of "lat,lng" into the input as a debug bridge until Google
  // Places autocomplete is wired. Returns true if it parsed successfully.
  const tryParseLatLng = (which, text) => {
    const m = text.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
    if (!m) return false;
    const lat = Number(m[1]);
    const lng = Number(m[2]);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return false;
    const setter = which === 'origin' ? setOrigin : setDestination;
    setter({ address: text, lat, lng, anchorId: null });
    return true;
  };

  const canQuote =
    origin.lat != null && origin.lng != null &&
    destination.lat != null && destination.lng != null &&
    pax >= 1;

  const fetchQuote = async () => {
    if (!canQuote) return;
    setQuoteState({ status: 'loading', data: null, error: null });
    setSelectedVehicleId(null);
    setSelectedAddonIds([]);
    try {
      const res = await fetch(`${API_BASE}/api/quotes/shuttle/transfer`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-tenant-host': TENANT_HOST,
        },
        body: JSON.stringify({
          service_type: serviceType,
          origin:      { address: origin.address || undefined,      lat: origin.lat,      lng: origin.lng },
          destination: { address: destination.address || undefined, lat: destination.lat, lng: destination.lng },
          pax,
          luggage,
          addonCodes: [],
          travelDate: date ? `${date}T00:00:00Z` : undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setQuoteState({ status: 'error', data: null, error: body?.error || `http_${res.status}` });
        return;
      }
      setQuoteState({ status: 'ok', data: body, error: null });
      // Pre-select cheapest vehicle, no addons.
      if (Array.isArray(body.vehicles) && body.vehicles.length > 0) {
        setSelectedVehicleId(body.vehicles[0].vehicleId);
      }
    } catch (err) {
      console.error('[transfers] quote failed:', err);
      setQuoteState({ status: 'error', data: null, error: 'network_error' });
    }
  };

  const selectedVehicle = quoteState.data?.vehicles?.find((v) => v.vehicleId === selectedVehicleId) || null;

  // Total in dollars for display + checkout.
  const totalDollars = (() => {
    if (!selectedVehicle) return 0;
    const baseCents = roundTrip ? selectedVehicle.priceRoundTrip : selectedVehicle.priceOneWay;
    const addonCents = (selectedVehicle.addons || [])
      .filter((a) => selectedAddonIds.includes(a.addonId))
      .reduce((s, a) => s + a.price, 0);
    return (baseCents + addonCents) / 100;
  })();

  const canSubmit =
    selectedVehicle &&
    customer.email && customer.name && customer.phone &&
    date && time &&
    !submitState.submitting;

  const submitToStripe = async () => {
    if (!canSubmit) return;
    setSubmitState({ submitting: true, error: null });
    try {
      const transferLine = {
        kind: 'transfer',
        serviceType,
        origin: { address: origin.address, lat: origin.lat, lng: origin.lng },
        destination: { address: destination.address, lat: destination.lat, lng: destination.lng },
        pax,
        luggage,
        vehicleId: selectedVehicle.vehicleId,
        vehicleName: selectedVehicle.name,
        routePriceId: selectedVehicle.routePriceId,
        roundTrip,
        addons: (selectedVehicle.addons || [])
          .filter((a) => selectedAddonIds.includes(a.addonId))
          .map((a) => ({ addonId: a.addonId, code: a.code, qty: 1, unitPrice: a.price / 100 })),
        currency: selectedVehicle.currency || 'USD',
        subtotal: totalDollars,
        ...(flightInfo ? { flightInfo } : {}),
      };
      const originUrl = window.location.origin + window.location.pathname;
      await window.tagcCart.submitAndRedirect({
        customer: {
          email: customer.email,
          name: customer.name,
          phone: customer.phone,
          locale: lang,
        },
        items: [transferLine],
        successUrl: `${originUrl}#/thanks?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl:  `${originUrl}#/transfers`,
      });
    } catch (err) {
      console.error('[transfers] checkout failed:', err);
      setSubmitState({
        submitting: false,
        error: err?.body?.error || err?.message || 'checkout_failed',
      });
    }
  };

  return (
    <div className="fade-in">
      {/* Hero — taller, with two backgrounds cross-fading every 7s. The dark
          overlay keeps text legible regardless of which image is on top. */}
      <section
        style={{
          color: 'var(--bone)',
          padding: '110px 0 130px',
          position: 'relative',
          overflow: 'hidden',
          background: 'var(--jungle)',
          minHeight: 380,
        }}
      >
        <div
          aria-hidden
          className="transfers-hero-bg transfers-hero-bg--a"
          style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'url(./images/transfer-hero-lagoon.png)',
            backgroundSize: 'cover',
            // Push the visible window down toward the bottom of the image so
            // the van (which sits low in both photos) stays in frame even
            // when the section gets cropped on tall viewports.
            backgroundPosition: 'center 85%',
          }}
        />
        <div
          aria-hidden
          className="transfers-hero-bg transfers-hero-bg--b"
          style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'url(./images/transfer-hero-highway.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center 80%',
          }}
        />
        {/* Horizontal gradient — dark on the left where the headline
            and copy sit, transparent on the right where the photo's
            subject (van) is so it keeps its natural light. Light
            bottom darken kept for the meta line + form card. */}
        <div
          aria-hidden
          style={{
            position: 'absolute', inset: 0,
            background:
              'linear-gradient(90deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.30) 35%, rgba(0,0,0,0) 65%),' +
              'linear-gradient(180deg, rgba(0,0,0,0) 65%, rgba(0,0,0,0.28) 100%)',
          }}
        />
        <div className="container" style={{ position: 'relative' }}>
          <div className="mono" style={{ color: 'var(--sun)', marginBottom: 14 }}>{lang === 'en' ? 'PRIVATE TRANSFERS · 24/7' : 'TRASLADOS PRIVADOS · 24/7'}</div>
          <h1 className="display" style={{ fontSize: 'clamp(38px, 5vw, 64px)', margin: 0, lineHeight: 1, maxWidth: 800, textShadow: '0 2px 16px rgba(0,0,0,0.45)' }}>
            {lang === 'en' ? <>Door-to-door, <span style={{ color: 'var(--sun)' }}>any hour.</span></> : <>De puerta a puerta, <span style={{ color: 'var(--sun)' }}>cualquier hora.</span></>}
          </h1>
          <p style={{ fontSize: 16, opacity: 0.92, marginTop: 14, maxWidth: 620, textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}>
            {lang === 'en'
              ? 'Real quotes from local operators. Pick your pickup + drop-off, choose a van, and you\'re booked.'
              : 'Cotizaciones reales de operadores locales. Elige pickup + destino, escoge tu van y reservas.'}
          </p>
        </div>
        {/* Lagoon waves anchoring the bottom-left corner — same brand
            note as the /port hero so the two heroes feel related. */}
        <WaveCorner placement="bottom-left" size={240} tone="lagoon"/>
      </section>

      {/* Search form */}
      <div className="container" style={{ marginTop: -36, position: 'relative', paddingBottom: 60 }}>
        <div className="card" style={{ padding: 24, boxShadow: 'var(--shadow)' }}>

          {/* Endpoints: pickup + drop-off side by side on desktop, stacked
              under 768px via .rg-transfers-form responsive rule. */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18 }} className="rg-transfers-form">
              <EndpointPicker
                which="origin"
                label={lang === 'en' ? 'PICKUP' : 'PICKUP'}
                endpoint={origin}
                setText={(text) => {
                  if (!tryParseLatLng('origin', text)) setEndpointFromText('origin', text);
                }}
                setAnchor={(anchor) => setEndpointFromAnchor('origin', anchor)}
                lang={lang}
              />
              <EndpointPicker
                which="destination"
                label={lang === 'en' ? 'DROP-OFF' : 'DESTINO'}
                endpoint={destination}
                setText={(text) => {
                  if (!tryParseLatLng('destination', text)) setEndpointFromText('destination', text);
                }}
                setAnchor={(anchor) => setEndpointFromAnchor('destination', anchor)}
                lang={lang}
              />
            </div>

            {/* Pax + luggage + date + time row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }} className="rg-transfers-form">
              <label className="field">
                <span className="mono">PAX</span>
                <Stepper value={pax} setValue={setPax} min={1} max={30} />
              </label>
              <label className="field">
                <span className="mono">{lang === 'en' ? 'LUGGAGE' : 'EQUIPAJE'}</span>
                <Stepper value={luggage} setValue={setLuggage} min={0} max={30} />
              </label>
              <label className="field">
                <span className="mono">{t.date || (lang === 'en' ? 'DATE' : 'FECHA')}</span>
                <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </label>
              <label className="field">
                <span className="mono">{t.time || (lang === 'en' ? 'TIME' : 'HORA')}</span>
                <input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </label>
            </div>

            {/* Round-trip toggle + quote button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                <input type="checkbox" checked={roundTrip} onChange={(e) => setRoundTrip(e.target.checked)} />
                {lang === 'en' ? 'Round-trip' : 'Viaje redondo'}
              </label>
              <button
                className="btn btn-primary btn-lg"
                disabled={!canQuote || quoteState.status === 'loading'}
                onClick={fetchQuote}
                style={{ minWidth: 200 }}
              >
                {quoteState.status === 'loading'
                  ? (lang === 'en' ? 'Quoting…' : 'Cotizando…')
                  : (lang === 'en' ? 'Get quote' : 'Cotizar')}
                {' '}<Icon d={icons.arrow} size={14} />
              </button>
            </div>
            {!canQuote && (
              <div className="mono" style={{ color: 'var(--ink-soft)', fontSize: 11 }}>
                {lang === 'en'
                  ? 'Pick pickup + drop-off (use a chip or paste lat,lng) to enable.'
                  : 'Selecciona pickup + destino (usa un chip o pega lat,lng) para activar.'}
              </div>
            )}
          </div>
        </div>

        {/* Quote results */}
        {quoteState.status === 'error' && (
          <div className="card" style={{ marginTop: 20, padding: 20, borderLeft: '4px solid var(--clay)' }}>
            <div className="mono" style={{ color: 'var(--clay)', marginBottom: 6 }}>
              {lang === 'en' ? 'NO QUOTE' : 'SIN COTIZACIÓN'}
            </div>
            <div style={{ fontSize: 14 }}>
              {quoteState.error === 'network_error'
                ? (lang === 'en' ? "Couldn't reach the booking engine. Try again." : 'No se pudo conectar al motor. Intenta de nuevo.')
                : (lang === 'en' ? `Error: ${quoteState.error}` : `Error: ${quoteState.error}`)}
            </div>
          </div>
        )}

        {quoteState.status === 'ok' && quoteState.data?.fallback?.applied && (
          <div className="card" style={{ marginTop: 20, padding: 20, borderLeft: '4px solid var(--sun)' }}>
            <div className="mono" style={{ color: 'var(--ink-soft)', marginBottom: 6 }}>
              {lang === 'en' ? 'NOT AVAILABLE' : 'NO DISPONIBLE'}
            </div>
            <div style={{ fontSize: 14 }}>
              {quoteState.data.fallback.message === 'outside_service_area'
                ? (lang === 'en'
                    ? "We don't service that area yet. Try a different pickup or drop-off."
                    : 'Aún no cubrimos esa zona. Prueba un pickup o destino distinto.')
                : (lang === 'en'
                    ? "No price loaded for that route. Contact us for a custom quote."
                    : 'Sin precio cargado para esa ruta. Escríbenos para cotización a medida.')}
            </div>
          </div>
        )}

        {quoteState.status === 'ok' && Array.isArray(quoteState.data?.vehicles) && quoteState.data.vehicles.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div className="mono" style={{ color: 'var(--ink-soft)', marginBottom: 12 }}>
              {(quoteState.data.originZone?.name) || origin.address} → {(quoteState.data.destinationZone?.name) || destination.address}
              {' · '}
              {lang === 'en' ? 'choose a van' : 'elige tu van'}
            </div>

            <div
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}
              className="rg-vehicle-cards"
            >
              {quoteState.data.vehicles.map((v) => {
                const sel = v.vehicleId === selectedVehicleId;
                const priceCents = roundTrip ? v.priceRoundTrip : v.priceOneWay;
                return (
                  <div
                    key={v.vehicleId}
                    onClick={() => { setSelectedVehicleId(v.vehicleId); setSelectedAddonIds([]); }}
                    className="card"
                    style={{
                      padding: 0,
                      cursor: 'pointer',
                      borderColor: sel ? 'var(--lagoon)' : 'var(--line)',
                      borderWidth: 2,
                      background: sel ? 'rgba(47, 184, 201, 0.06)' : 'var(--bone)',
                      display: 'flex', flexDirection: 'column', overflow: 'hidden',
                    }}
                  >
                    {v.imageUrl ? (
                      <img
                        src={v.imageUrl}
                        alt={v.name}
                        style={{
                          width: '100%', aspectRatio: '3 / 2', objectFit: 'cover',
                          background: 'var(--bone-2)',
                          borderBottom: '1px solid var(--line)',
                        }}
                        loading="lazy"
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%', aspectRatio: '3 / 2',
                          background: 'var(--bone-2)',
                          borderBottom: '1px solid var(--line)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'var(--ink-soft)', fontSize: 11,
                        }}
                        className="mono"
                      >
                        {lang === 'en' ? 'NO PHOTO' : 'SIN FOTO'}
                      </div>
                    )}
                    <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input type="radio" checked={sel} onChange={() => setSelectedVehicleId(v.vehicleId)} />
                        <span style={{ fontWeight: 600, fontSize: 15, lineHeight: 1.1 }}>{v.name}</span>
                      </div>
                      <span className="mono" style={{ color: 'var(--ink-soft)', fontSize: 11, marginLeft: 22 }}>
                        {v.passengerCapacity} pax · {v.luggageCapacity} bags
                      </span>
                      {v.vendorName && (
                        <span className="mono" style={{ color: 'var(--ink-soft)', fontSize: 10, marginLeft: 22 }}>
                          {lang === 'en' ? 'Operated by' : 'Operado por'} {v.vendorName}
                        </span>
                      )}
                      <div style={{ marginTop: 'auto', paddingTop: 10, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 6 }}>
                        <div className="display" style={{ fontSize: 22, lineHeight: 1 }}>${dollarsFromCents(priceCents)}</div>
                        <div className="mono" style={{ color: 'var(--ink-soft)', fontSize: 10 }}>{v.currency} · {roundTrip ? 'RT' : 'OW'}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Addons panel — outside the cards row so adding/removing the
                panel doesn't change the size of the selected card and break
                the 3-up grid alignment. */}
            {selectedVehicle && Array.isArray(selectedVehicle.addons) && selectedVehicle.addons.length > 0 && (
              <div className="card" style={{ marginTop: 12, padding: 16 }}>
                <div className="mono" style={{ color: 'var(--ink-soft)', marginBottom: 8, fontSize: 11 }}>
                  {lang === 'en' ? 'ADD-ONS' : 'EXTRAS'}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
                  {selectedVehicle.addons.map((a) => {
                    const checked = selectedAddonIds.includes(a.addonId);
                    return (
                      <label
                        key={a.addonId}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '8px 10px', border: '1px solid var(--line)', borderRadius: 8, cursor: 'pointer',
                          background: checked ? 'var(--bone-2)' : 'transparent',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAddonIds([...selectedAddonIds, a.addonId]);
                            } else {
                              setSelectedAddonIds(selectedAddonIds.filter((id) => id !== a.addonId));
                            }
                          }}
                        />
                        <span style={{ flex: 1, fontSize: 13 }}>{a.name}</span>
                        <span className="mono" style={{ fontSize: 11 }}>
                          {a.price === 0 ? (lang === 'en' ? 'incl.' : 'incl.') : `+$${dollarsFromCents(a.price)}`}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Optional flight info */}
            {selectedVehicle && isAirportInvolved && (
              <div className="card" style={{ marginTop: 16, padding: 16 }}>
                <label className="field">
                  <span className="mono">{lang === 'en' ? 'FLIGHT INFO (optional)' : 'INFO DE VUELO (opcional)'}</span>
                  <input
                    className="input"
                    type="text"
                    placeholder={lang === 'en' ? 'AA1234 · arrives 14:30' : 'AA1234 · llega 14:30'}
                    value={flightInfo}
                    onChange={(e) => setFlightInfo(e.target.value)}
                  />
                </label>
              </div>
            )}

            {/* Customer info */}
            {selectedVehicle && (
              <div className="card" style={{ marginTop: 16, padding: 20 }}>
                <div className="mono" style={{ color: 'var(--ink-soft)', marginBottom: 12 }}>
                  {lang === 'en' ? 'YOUR INFO' : 'TUS DATOS'}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} className="rg-transfers-form">
                  <label className="field">
                    <span className="mono">{lang === 'en' ? 'EMAIL' : 'EMAIL'}</span>
                    <input className="input" type="email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} />
                  </label>
                  <label className="field">
                    <span className="mono">{lang === 'en' ? 'FULL NAME' : 'NOMBRE'}</span>
                    <input className="input" type="text" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
                  </label>
                  <label className="field" style={{ gridColumn: '1 / -1' }}>
                    <span className="mono">{lang === 'en' ? 'PHONE / WHATSAPP' : 'TELÉFONO / WHATSAPP'}</span>
                    <input className="input" type="tel" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
                  </label>
                </div>
              </div>
            )}

            {/* Total + Reservar */}
            {selectedVehicle && (
              <div
                className="card"
                style={{
                  marginTop: 16, padding: 20,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
                }}
              >
                <div>
                  <div className="mono" style={{ color: 'var(--ink-soft)', fontSize: 11 }}>{lang === 'en' ? 'TOTAL' : 'TOTAL'}</div>
                  <div className="display" style={{ fontSize: 36, lineHeight: 1 }}>${totalDollars.toFixed(2)} <span style={{ fontSize: 14, opacity: 0.7 }}>{selectedVehicle.currency}</span></div>
                  <div className="mono" style={{ color: 'var(--ink-soft)', fontSize: 11, marginTop: 4 }}>
                    {selectedVehicle.name} · {roundTrip ? (lang === 'en' ? 'round-trip' : 'redondo') : (lang === 'en' ? 'one-way' : 'sencillo')}
                    {selectedVehicle.vendorName ? ` · ${selectedVehicle.vendorName}` : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {submitState.error && (
                    <div className="mono" style={{ color: 'var(--clay)', fontSize: 11, marginBottom: 8 }}>
                      {lang === 'en' ? 'Checkout failed' : 'Falló el checkout'} — {submitState.error}
                    </div>
                  )}
                  <button
                    className="btn btn-sun btn-lg"
                    disabled={!canSubmit}
                    onClick={submitToStripe}
                    style={{ minWidth: 220 }}
                  >
                    {submitState.submitting
                      ? (lang === 'en' ? 'Redirecting…' : 'Redirigiendo…')
                      : (lang === 'en' ? 'Reserve & pay' : 'Reservar y pagar')}
                    {' '}<Icon d={icons.arrow} size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// EndpointPicker — text input + chip-quick-select row.
// When Google Places lands, swap the input element for an autocomplete
// component that calls the geocoder and writes lat/lng directly. Until
// then the chips populate lat/lng and the input is freeform / accepts
// "lat,lng" as a debug bridge.
const EndpointPicker = ({ which, label, endpoint, setText, setAnchor, lang }) => {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
        <span className="mono" style={{ color: 'var(--ink-soft)' }}>{label}</span>
        {endpoint.lat != null && endpoint.lng != null && (
          <span className="mono" style={{ color: 'var(--ink-soft)', fontSize: 10 }}>
            {endpoint.lat.toFixed(4)}, {endpoint.lng.toFixed(4)}
          </span>
        )}
      </div>
      <input
        className="input"
        type="text"
        placeholder={lang === 'en' ? 'Hotel name, address, or pick a chip below' : 'Nombre del hotel, dirección, o elige un chip abajo'}
        value={endpoint.address}
        onChange={(e) => setText(e.target.value)}
        autoComplete="off"
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
        {TRANSFER_ANCHORS.map((a) => {
          const active = endpoint.anchorId === a.id;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => setAnchor(a)}
              className={`chip ${active ? 'active' : ''}`}
              style={{ border: 'none', cursor: 'pointer', fontSize: 11, opacity: active ? 1 : 0.85 }}
            >
              {a.label[lang] || a.label.en}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Map page
// Does a tour belong to a given map pin? Matches by:
//  1. tour id containing the pin id (e.g. 'muyil-float' ↔ 'muyil')
//  2. location string mentions the pin name
//  3. pickupPoints' label (en or es) mentions the pin name
//  4. category-based fallbacks for hub pins (bacalar → all lagoon tours, etc.)
const tourMatchesPin = (tour, pin) => {
  if (!pin) return true;
  const pinId   = pin.id;
  const pinName = pin.name.toLowerCase();
  if (tour.id === pinId || tour.id.includes(pinId)) return true;
  if ((tour.location || '').toLowerCase().includes(pinName)) return true;
  if (Array.isArray(tour.pickupPoints) && tour.pickupPoints.some(p =>
    ((p.label?.en || '') + ' ' + (p.label?.es || '')).toLowerCase().includes(pinName)
  )) return true;
  if (pinId === 'bacalar' && tour.category === 'lagoon') return true;
  if (pinId === 'mahahual' && tour.audience.includes('port')) return true;
  if (pinId === 'cancun'   && tour.id === 'transfer-cun') return true;
  if (pinId === 'cancun'   && tour.id === 'chichen-riviera') return true;
  if (pinId === 'tulum'    && tour.id === 'transfer-tulum') return true;
  if (pinId === 'chichen'  && (tour.id === 'chichen-itza' || tour.id === 'chichen-riviera')) return true;
  return false;
};

const MapPage = ({ focus }) => {
  const { t, lang, navigate } = useT();
  const [sel, setSel] = useState(focus || null);
  const selected = window.MAP_PINS.find(p => p.id === sel);
  const toursToShow = selected
    ? window.TOURS.filter(tour => tourMatchesPin(tour, selected))
    : window.TOURS;

  return (
    <div className="container fade-in" style={{ paddingTop: 32, paddingBottom: 40 }}>
      <div className="mono" style={{ color:'var(--ink-soft)', marginBottom: 8 }}>03 / MAP · 18.68°N 88.38°W</div>
      <h1 className="display" style={{ fontSize: 56, margin: '0 0 24px', lineHeight: 0.95 }}>
        {lang==='en'?'Tap a pin.':'Toca un pin.'} <span style={{color:'var(--clay)'}}>{lang==='en'?'Find your tour.':'Encuentra tu tour.'}</span>
      </h1>

      <div className="rg" style={{ display:'grid', gridTemplateColumns: '1.4fr 1fr', gap: 28, alignItems:'flex-start' }}>
        <div>
          <MiniMap onPinClick={(p)=>setSel(p.id)} selected={sel}/>
          <div style={{ display:'flex', gap: 8, flexWrap:'wrap', marginTop: 16, alignItems:'center' }}>
            <button
              className={`chip ${!sel ? 'active' : ''}`}
              onClick={()=>setSel(null)}
              style={{ border:'none', cursor:'pointer' }}>
              {lang === 'en' ? 'All' : 'Todos'}
            </button>
            {window.MAP_PINS.map(p => (
              <button key={p.id} className={`chip ${sel === p.id ? 'active' : ''}`} onClick={()=>setSel(p.id)} style={{ border:'none', cursor:'pointer' }}>
                <Icon d={icons.pin} size={10}/> {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 24, minHeight: 400 }}>
          <div className="fade-in">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div className="mono" style={{ color:'var(--ink-soft)' }}>
                  {selected ? 'SELECTED' : (lang === 'en' ? 'ALL DESTINATIONS' : 'TODOS LOS DESTINOS')}
                </div>
                <h2 className="display" style={{ fontSize: 32, margin: '4px 0 6px', lineHeight: 1 }}>
                  {selected ? selected.name : (lang === 'en' ? 'Our catalog' : 'Nuestro catálogo')}
                </h2>
                <div className="mono" style={{ color:'var(--clay)', marginBottom: 16 }}>
                  {selected
                    ? selected.label[lang]
                    : `${toursToShow.length} ${toursToShow.length === 1 ? (t.item || 'tour') : (t.items || 'tours')}`
                  }
                </div>
              </div>
              {selected && (
                <button
                  onClick={()=>setSel(null)}
                  className="btn btn-ghost btn-sm"
                  title={lang === 'en' ? 'Clear selection' : 'Quitar selección'}>
                  <Icon d={icons.x} size={12}/> {lang === 'en' ? 'All' : 'Todos'}
                </button>
              )}
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap: 10, maxHeight: 520, overflowY: 'auto', paddingRight: 4 }}>
              {toursToShow.map(tour => (
                <div key={tour.id} onClick={()=>navigate('detail', { tourId: tour.id })}
                  style={{ display:'flex', gap: 12, padding: 10, borderRadius: 10, border:'1px solid var(--line)', cursor:'pointer', alignItems:'center' }}>
                  <window.Photo src={window.tourPhoto(tour)} style={{ width: 64, height: 64, borderRadius: 8, flexShrink: 0 }} overlay={false}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.2 }}>{tour.title[lang]}</div>
                    <div className="mono" style={{ color:'var(--ink-soft)', marginTop: 4, fontSize: 10 }}>
                      ${tour.priceAdult}{!tour.flat ? ` · ${tour.duration}h` : ' · ' + (t.perVan || 'per van')}
                    </div>
                  </div>
                  <Icon d={icons.arrow} size={14}/>
                </div>
              ))}
              {toursToShow.length === 0 && (
                <div style={{ color:'var(--ink-soft)', fontSize: 13, textAlign:'center', padding: 24 }}>
                  {lang==='en' ? 'No tours at this pin yet — ask us on WhatsApp.' : 'Sin tours en este pin — escríbenos por WhatsApp.'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.Transfers = Transfers;
window.MapPage = MapPage;
