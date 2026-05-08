// Tour detail page — gallery, specs, reviews, booking panel
const TourDetail = ({ tourId, prefill }) => {
  const { t, lang, navigate, addToCart, openLightbox, displayCurrency } = useT();
  // Convert source-currency prices to the user-toggled display currency.
  // Falls back to source amount + source code when no rate is wired so the
  // panel never blanks out.
  const _convPrice = (amt, src) => {
    const dst = displayCurrency || src || 'USD';
    if (amt == null) return { amount: 0, currency: dst };
    if (!window.tagcConvertPrice) return { amount: amt, currency: src || 'USD' };
    if ((src || 'USD') === dst) return { amount: amt, currency: dst };
    const conv = window.tagcConvertPrice(amt, src || 'USD', dst);
    if (conv == null) return { amount: amt, currency: src || 'USD' };
    return { amount: Math.round(conv), currency: dst };
  };

  // Ray-casting point-in-polygon for GeoJSON Polygon { type, coordinates: [[[lng,lat],...]] }.
  // Uses the outer ring only (holes ignored — none in our seeded zones).
  const _pointInPolygon = (lng, lat, geom) => {
    if (!geom || geom.type !== 'Polygon' || !Array.isArray(geom.coordinates)) return true;
    const ring = geom.coordinates[0];
    if (!Array.isArray(ring) || ring.length < 3) return true;
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      const intersect = ((yi > lat) !== (yj > lat)) &&
        (lng < ((xj - xi) * (lat - yi)) / ((yj - yi) || 1e-12) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };
  const tour = window.TOURS.find(x => x.id === tourId) || window.TOURS[0];

  // Hooks must run on every render in the same order — call them all up
  // front with safe `tour?.…` access, THEN early-return if tour isn't
  // ready. Otherwise React's rules-of-hooks fire when window.TOURS is
  // still empty on first paint.
  const [adults, setAdults] = useState(2);
  const [kids, setKids] = useState(0);
  const [infants, setInfants] = useState(0);
  const [selDate, setSelDate] = useState(prefill?.prefillDate || null);
  const [selTime, setSelTime] = useState(
    prefill?.prefillTime && tour?.times && tour.times.includes(prefill.prefillTime)
      ? prefill.prefillTime
      : null
  );
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [addons, setAddons] = useState({});
  const [pickupIdx, setPickupIdx] = useState(0);
  const [selectedTransport, setSelectedTransport] = useState(null);
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupCoords, setPickupCoords] = useState(null); // {lat, lng} once a Place is picked
  const [pickupOutOfZone, setPickupOutOfZone] = useState(false);
  const [pickupAddressTouched, setPickupAddressTouched] = useState(false);
  const pickupInputRef = useRef(null);

  // Bind Google Places Autocomplete to the pickup input once the
  // customer chooses a transport option and the input is mounted. Bounds
  // bias suggestions to the southern Yucatán + Mayan Riviera so a
  // customer typing "Hotel La Aldea" gets the Bacalar one first. Same
  // pattern as port_transfers_map.jsx's EndpointPicker.
  useEffect(() => {
    if (!selectedTransport || !pickupInputRef.current) return;
    if (typeof window.loadGoogleMaps !== 'function') return;
    let listener = null;
    let cancelled = false;
    window.loadGoogleMaps().then((maps) => {
      if (cancelled || !pickupInputRef.current) return;
      const ac = new maps.places.Autocomplete(pickupInputRef.current, {
        bounds: new maps.LatLngBounds(
          { lat: 17.5, lng: -89.5 },
          { lat: 22.0, lng: -85.5 }
        ),
        strictBounds: false,
        fields: ['formatted_address', 'name', 'geometry', 'place_id'],
      });
      listener = ac.addListener('place_changed', () => {
        const place = ac.getPlace();
        if (!place) return;
        const text = place.formatted_address || place.name || '';
        if (text) setPickupAddress(text);
        if (place.geometry?.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          setPickupCoords({ lat, lng });
          // Validate against the option's service area polygon if present.
          // Ray-casting point-in-polygon over GeoJSON [lng,lat] rings.
          const poly = selectedTransport?.serviceArea?.geometry;
          setPickupOutOfZone(poly ? !_pointInPolygon(lng, lat, poly) : false);
        } else {
          setPickupCoords(null);
          setPickupOutOfZone(false);
        }
      });
    }).catch((err) => {
      console.warn('[detail] Google Maps SDK load failed', err);
    });
    return () => {
      cancelled = true;
      if (listener?.remove) listener.remove();
    };
  }, [selectedTransport]);

  // window.TOURS may be empty during the initial paint (data-api hasn't
  // populated it yet). Render a tiny shell rather than crashing on
  // tour.title[lang] / tour.audience etc. further down.
  if (!tour) {
    return (
      <div className="container" style={{ paddingTop: 60, textAlign: 'center', color: 'var(--ink-soft)' }}>
        <div className="mono">Loading…</div>
      </div>
    );
  }

  const _adultPrice = _convPrice(tour.priceAdult, tour.defaultCurrency);
  const _kidPrice = _convPrice(tour.priceKid, tour.defaultCurrency);
  const hasPickups = Array.isArray(tour.pickupPoints) && tour.pickupPoints.length > 1;
  const pickup = (Array.isArray(tour.pickupPoints) && tour.pickupPoints[pickupIdx]) || null;
  const pickupSurcharge = pickup?.surcharge || 0;

  // Optional transport options attached to this tour (e.g., round-trip
  // taxi pickup from any hotel inside a service zone). selectedTransport
  // = null means "no pickup, customer goes to the meeting point".
  const transportOptions = Array.isArray(tour.transportOptions) ? tour.transportOptions : [];

  // Convert a transport option's price (in option.pricing.currency, cents)
  // into the tour's default currency so the cart total can stay in a
  // single currency. Falls back to source amount if FX is missing.
  const _transportTotalInTourCurrency = (opt, pax) => {
    if (!opt) return { cents: 0, vehicleCount: 0 };
    const cap = opt.vehicle?.passengerCapacity || 1;
    const vehicleCount = Math.max(1, Math.ceil(pax / cap));
    const baseCents = (opt.defaultDirection === 'round_trip'
      ? (opt.pricing?.priceRoundTrip ?? opt.pricing?.priceOneWay)
      : opt.pricing?.priceOneWay) || 0;
    const totalSrcCents = baseCents * vehicleCount;
    const srcCurrency = opt.pricing?.currency || 'USD';
    const dstCurrency = tour.defaultCurrency || 'USD';
    if (srcCurrency === dstCurrency) {
      return { cents: totalSrcCents, vehicleCount };
    }
    const conv = window.tagcConvertPrice
      ? window.tagcConvertPrice(totalSrcCents, srcCurrency, dstCurrency)
      : null;
    return {
      cents: conv == null ? totalSrcCents : Math.round(conv),
      vehicleCount,
    };
  };

  const gallery = window.tourGallery(tour);

  // Tour add-ons aren't sourced from anywhere yet — Bokun import doesn't
  // capture extras. Optional taxi pickup now lives in the dedicated
  // "Optional transport" section above (sourced from tour_transport_options).
  // Leaving the slot empty until a real source of add-ons (tour-level
  // upsells: photo pack, premium lunch, etc.) is wired through the API.
  const addonList = [];

  // Infants are free by default. If a tenant later wires up
  // TourZonePrice rows with paxCategory='infant' the price calc will
  // need updating, but for now they're a manifest-only count for the
  // operator (so they know how many car seats / how full the boat is).
  const _pax = Math.max(1, (Number(adults) || 0) + (Number(kids) || 0));
  const _transportInfo = _transportTotalInTourCurrency(selectedTransport, _pax);
  const _transportSubtotal = _transportInfo.cents / 100;
  const total = (tour.flat
    ? tour.priceAdult + Object.keys(addons).filter(k=>addons[k]).reduce((a,k)=>a+(addonList.find(x=>x.k===k)?.price||0)*1,0)
    : adults * tour.priceAdult + kids * (tour.priceKid||0) + (adults+kids) * Object.keys(addons).filter(k=>addons[k]).reduce((a,k)=>a+(addonList.find(x=>x.k===k)?.price||0),0)
  ) + pickupSurcharge + _transportSubtotal;

  const tourReviews = window.REVIEWS.filter(r => r.tour === tour.id).concat(window.REVIEWS.filter(r => r.tour !== tour.id).slice(0,2));

  // Pull schedule + blackout config straight off the loaded tour. The
  // catalog API hydrates these when ensureDetail() runs (data-api.js),
  // so by the time this page renders we usually have them. Defaults
  // mean the picker degrades gracefully if they haven't arrived yet.
  const cutoffHours = tour.schedules?.[0]?.cutoffHoursBefore ?? 24;

  const transportAddressOk =
    !selectedTransport ||
    (pickupAddress.trim().length > 0 && !pickupOutOfZone);
  // Tours with no scheduled startTimes (Bokun request-only) skip the
  // time requirement; the date alone + the request CTA is enough.
  const hasTimeSlots = Array.isArray(tour.times) && tour.times.length > 0;
  const canBook = selDate && (!hasTimeSlots || selTime) && (tour.flat || adults > 0) && transportAddressOk;

  return (
    <div className="fade-in">
      {/* Breadcrumb + back */}
      <div className="container" style={{ paddingTop: 20, paddingBottom: 8, display:'flex', alignItems:'center', gap: 10 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('catalog')}>
          <Icon d={icons.chevronLeft} size={14}/> {t.navTours}
        </button>
        <span className="mono" style={{ color:'var(--ink-soft)' }}>/ {tour.phLabel}</span>
      </div>

      {/* Gallery + header. Layout adapts to gallery length so a tour
          with 1 photo doesn't render an empty 5-cell collage:
            1 photo  → full-width hero
            2 photos → 50/50 split
            3 photos → big left + 2 stacked right
            4 photos → big left + 3 stacked right
            5+ photos → 1 big + 4 small (legacy collage). */}
      <div className="container" style={{ paddingTop: 12 }}>
        {gallery.length > 0 && (() => {
          const n = gallery.length;
          const HERO_H_TALL = 460;     // 1 photo
          const ROW_H = 220;           // each row of the multi-photo grid
          const galTotalH = ROW_H * 2 + 10; // matches gridTemplateRows + gap

          // Pick a column template per count.
          let cols;
          if (n === 1)      cols = '1fr';
          else if (n === 2) cols = '1fr 1fr';
          else              cols = '1.3fr 1fr 1fr'; // 3+ photos

          // Single hero row for 1 photo, otherwise the 2-row collage.
          const rows = n === 1 ? `${HERO_H_TALL}px` : `${ROW_H}px ${ROW_H}px`;

          // The "View all" badge only makes sense once the user can't
          // see the full set at a glance.
          const showCountBadge = n >= 2;
          const heroBigSpansBothRows = n >= 3; // for n=2 each photo is its own column

          return (
            <div
              className="rg-gallery"
              style={{
                display: 'grid',
                gridTemplateColumns: cols,
                gridTemplateRows: rows,
                gap: 10,
                marginBottom: 28,
              }}
            >
              {/* Hero photo (always slot 0). */}
              <div
                className="gallery-tile"
                style={{
                  gridRow: heroBigSpansBothRows ? 'span 2' : 'auto',
                  position: 'relative',
                  cursor: 'zoom-in',
                  overflow: 'hidden',
                  borderRadius: 'var(--radius-lg)',
                }}
                onClick={() => openLightbox(gallery, 0)}
              >
                <window.Photo
                  src={gallery[0].src}
                  label={gallery[0].label}
                  style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-lg)' }}
                />
                {showCountBadge && (
                  <button
                    onClick={(e) => { e.stopPropagation(); openLightbox(gallery, 0); }}
                    aria-label={lang === 'en' ? 'View all photos' : 'Ver todas las fotos'}
                    style={{
                      position: 'absolute', right: 14, bottom: 14,
                      padding: '8px 14px', borderRadius: 999,
                      background: 'rgba(246,241,230,0.92)', color: 'var(--ink)',
                      border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6,
                      fontSize: 12, fontWeight: 600,
                      boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                    }}
                  >
                    <Icon d={icons.search} size={13}/>
                    {n} {lang === 'en' ? 'photos' : 'fotos'}
                  </button>
                )}
              </div>

              {/* Remaining photos — slice by what the layout can hold.
                  n=2 → 1 photo on the right.
                  n=3 → 2 photos stacked in the right column.
                  n=4 → 3 photos: 2 in middle col, 1 in right (or vice
                  versa, depending on order). The grid auto-flow places
                  them in row-major order across the remaining cells.
                  n=5+ → cap at 4 extras (legacy collage shape). */}
              {gallery.slice(1, n === 2 ? 2 : n <= 4 ? n : 5).map((g, i) => (
                <div
                  key={i}
                  className="gallery-tile"
                  style={{
                    cursor: 'zoom-in',
                    overflow: 'hidden',
                    borderRadius: 'var(--radius)',
                  }}
                  onClick={() => openLightbox(gallery, i + 1)}
                >
                  <window.Photo
                    src={g.src}
                    label={g.label}
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
              ))}
            </div>
          );
        })()}

        <div className="rg-sidebar" style={{ display:'grid', gridTemplateColumns: '1fr 380px', gap: 48, alignItems:'flex-start' }}>
          {/* LEFT: details */}
          <div>
            <div style={{ display:'flex', gap: 8, marginBottom: 14, flexWrap:'wrap' }}>
              {tour.audience.includes('port') && <span className="badge clay dot">{t.filterPort}</span>}
              {tour.isFeatured && <span className="badge sun">★ Featured</span>}
              {tour.isVipPrivate && <span className="badge jungle">Private</span>}
              <span className="badge ghost"><Icon d={icons.clock} size={10}/> {tour.duration} {t.hours}</span>
              <span className="badge ghost"><Icon d={icons.pin} size={10}/> {tour.location}</span>
              {tour.difficulty && (
                <span className="badge ghost" style={{ textTransform:'capitalize' }}>
                  Difficulty: {tour.difficulty}
                </span>
              )}
              {tour.maxPax && (
                <span className="badge ghost">
                  Max {tour.maxPax} pax
                </span>
              )}
              {tour.isNew && (
                <span
                  style={{
                    background: '#ef2d56',
                    color: '#ffffff',
                    fontSize: 11,
                    letterSpacing: 1.6,
                    padding: '5px 11px',
                    borderRadius: 999,
                    textTransform: 'uppercase',
                    fontWeight: 800,
                    boxShadow: '0 3px 10px rgba(239,45,86,0.45)',
                  }}
                >
                  {lang === 'en' ? 'NEW' : 'NUEVO'}
                </span>
              )}
            </div>
            <h1 className="display" style={{ fontSize: 56, margin: 0, lineHeight: 0.95, letterSpacing: '-0.03em' }}>
              {tour.title[lang]}
            </h1>
            {/* Brush-script tagline — same treatment as the home-page
                section subtitles ("seven colors, no rush"). Keeps the
                tour-detail hero tied to the brand voice instead of a
                generic ink-soft paragraph. */}
            <div className="script" style={{ fontSize: 30, color: 'var(--lagoon-deep)', marginTop: 14, lineHeight: 1.1 }}>
              {tour.tagline[lang]}
            </div>

            <div style={{ display:'flex', gap: 24, marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--line)', flexWrap:'wrap' }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap: 6, color:'var(--sun-2)' }}>
                  <window.Stars rating={tour.rating} size={16}/>
                  <span style={{ fontWeight: 600 }}>{tour.rating}</span>
                </div>
                <div className="mono" style={{ color:'var(--ink-soft)', marginTop: 4 }}>{tour.reviews} {t.reviews}</div>
              </div>
            </div>

            {/* ABOUT (long description) */}
            {tour.descriptionHtml && tour.descriptionHtml[lang] && (
              <div style={{ marginTop: 36 }}>
                <div className="mono" style={{ color:'var(--ink-soft)', marginBottom: 14 }}>02 / {(lang==='en'?'About this tour':'Sobre el tour').toUpperCase()}</div>
                <div
                  style={{ fontSize: 16, lineHeight: 1.65, color:'var(--ink)' }}
                  dangerouslySetInnerHTML={{ __html: tour.descriptionHtml[lang] }}
                />
              </div>
            )}

            {/* INCLUDES */}
            <div style={{ marginTop: 36 }}>
              <div className="mono" style={{ color:'var(--ink-soft)', marginBottom: 14 }}>03 / {t.includes.toUpperCase()}</div>
              <div style={{ display:'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {tour.includes.map((inc,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap: 10, padding: 12, background: 'var(--bone-2)', borderRadius: 10 }}>
                    <div style={{ width: 24, height: 24, borderRadius:'50%', background:'var(--lagoon)', color:'var(--ink)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink: 0 }}>
                      <Icon d={icons.check} size={12} stroke={2.5}/>
                    </div>
                    <span style={{ fontSize: 14 }}>{inc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* MEETING POINT */}
            {tour.meet && (
              <div style={{ marginTop: 36 }}>
                <div className="mono" style={{ color:'var(--ink-soft)', marginBottom: 14 }}>04 / {t.meetingPoint.toUpperCase()}</div>
                <div className="card" style={{ padding: 20, display:'flex', gap: 16, alignItems:'center' }}>
                  <div style={{ width: 48, height: 48, borderRadius:'50%', background: 'var(--sun)', color:'var(--ink)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Icon d={icons.pin} size={20}/>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{tour.meet[lang]}</div>
                    <div className="mono" style={{ color:'var(--ink-soft)', marginTop: 4 }}>{tour.location}</div>
                  </div>
                </div>
              </div>
            )}

            {/* ITINERARY */}
            {tour.itineraryHtml && tour.itineraryHtml[lang] && (
              <div style={{ marginTop: 36 }}>
                <div className="mono" style={{ color:'var(--ink-soft)', marginBottom: 14 }}>
                  {(lang==='en'?'Itinerary':'Itinerario').toUpperCase()}
                </div>
                <div
                  style={{ fontSize: 15, lineHeight: 1.7 }}
                  dangerouslySetInnerHTML={{ __html: tour.itineraryHtml[lang] }}
                />
              </div>
            )}

            {/* NOT INCLUDED */}
            {tour.exclusionsHtml && tour.exclusionsHtml[lang] && (
              <div style={{ marginTop: 36 }}>
                <div className="mono" style={{ color:'var(--ink-soft)', marginBottom: 14 }}>
                  {(lang==='en'?"What's not included":'No incluye').toUpperCase()}
                </div>
                <div
                  style={{ fontSize: 15, lineHeight: 1.7, color:'var(--ink-soft)' }}
                  dangerouslySetInnerHTML={{ __html: tour.exclusionsHtml[lang] }}
                />
              </div>
            )}

            {/* CANCELLATION POLICY */}
            {tour.termsHtml && tour.termsHtml[lang] && (
              <details style={{ marginTop: 36, padding: 20, border:'1px solid var(--line)', borderRadius: 12, background: 'var(--bone-2)' }}>
                <summary style={{ cursor:'pointer', fontWeight: 600, fontSize: 14 }}>
                  {(lang==='en'?'Cancellation policy & terms':'Cancelación y términos')}
                </summary>
                <div
                  style={{ fontSize: 14, lineHeight: 1.6, marginTop: 14, color:'var(--ink-soft)' }}
                  dangerouslySetInnerHTML={{ __html: tour.termsHtml[lang] }}
                />
              </details>
            )}

            {/* BLACKOUT NOTICE (informational — date picker enforcement is later) */}
            {Array.isArray(tour.blackoutDates) && tour.blackoutDates.length > 0 && (
              <div style={{ marginTop: 24, padding: 14, borderRadius: 10, background: 'rgba(229, 73, 73, 0.08)', border:'1px solid rgba(229, 73, 73, 0.2)' }}>
                <div className="mono" style={{ color:'var(--clay)', marginBottom: 6 }}>
                  {(lang==='en'?'Unavailable dates':'Fechas no disponibles').toUpperCase()}
                </div>
                <div style={{ fontSize: 13, color:'var(--ink-soft)' }}>
                  {tour.blackoutDates.join(' · ')}
                </div>
              </div>
            )}

            {/* REVIEWS */}
            <div style={{ marginTop: 40 }}>
              <div className="mono" style={{ color:'var(--ink-soft)', marginBottom: 14 }}>05 / {t.reviews.toUpperCase()} · {tour.reviews}</div>
              <div style={{ display:'flex', flexDirection:'column', gap: 16 }}>
                {tourReviews.slice(0,3).map((r,i) => (
                  <div key={i} className="card" style={{ padding: 20 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 10 }}>
                      <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius:'50%', background:'var(--lagoon-pale)', display:'flex', alignItems:'center', justifyContent:'center', fontSize: 16 }}>
                          {r.flag}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</div>
                          <div className="mono" style={{ color:'var(--ink-soft)' }}>{r.date}</div>
                        </div>
                      </div>
                      <window.Stars rating={r.rating}/>
                    </div>
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{r.body[lang]}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: booking panel */}
          <div className="rg-sticky-col" style={{ position:'sticky', top: 90 }}>
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', gap: 12, flexWrap:'wrap' }}>
                <div style={{ minWidth: 0 }}>
                  <span className="mono" style={{ color:'var(--ink-soft)' }}>{t.from}</span>
                  <div className="display" style={{ fontSize: 40 }}>
                    ${_adultPrice.amount} <span style={{ fontSize: 16, opacity: 0.6 }}>{_adultPrice.currency}</span>
                  </div>
                  <div className="mono" style={{ color:'var(--ink-soft)' }}>
                    {tour.flat
                      ? t.perVan
                      : tour.priceUnit === 'per_booking'
                        ? (t.perGroup || t.perVan)
                        : t.perPerson}
                  </div>
                  {tour.priceKid > 0 && tour.priceUnit !== 'per_booking' && (
                    <div className="mono" style={{ color:'var(--ink-soft)', fontSize: 12, marginTop: 4 }}>
                      {lang==='en' ? 'Child' : 'Niño'}
                      {tour.childMinAge != null && tour.childMaxAge != null
                        ? ` (${tour.childMinAge}–${tour.childMaxAge}) `
                        : ' '}
                      ${_kidPrice.amount} {_kidPrice.currency}
                    </div>
                  )}
                </div>
                <span className="badge lagoon dot" style={{ flexShrink: 0 }}>
                  {tour.isRequestOnly
                    ? (t.requestOnly || (lang==='en'?'On request':'Bajo cotización'))
                    : (lang==='en'?'available today':'disponible hoy')}
                </span>
              </div>

              <div style={{ height: 1, background:'var(--line)', margin: '20px 0' }}/>

              {/* Pickup selector */}
              {hasPickups && (
                <label className="field" style={{ marginBottom: 14 }}>
                  <span className="mono">{lang === 'en' ? 'Pickup' : 'Recogida'}</span>
                  <select className="select" value={pickupIdx} onChange={(e)=>setPickupIdx(Number(e.target.value))}>
                    {tour.pickupPoints.map((p, i) => (
                      <option key={i} value={i}>
                        {p.label[lang]}{p.surcharge > 0 ? ` · +$${p.surcharge}` : ''}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {/* Date picker — full month grid that respects the tour's
                  active schedule, blackouts, and booking cutoff. */}
              <label className="field">
                <span className="mono">{t.date}</span>
                <DatePicker
                  value={selDate}
                  onChange={setSelDate}
                  schedules={tour.schedules || []}
                  blackoutDates={tour.blackoutDates || []}
                  cutoffHours={cutoffHours}
                />
              </label>

              {/* Time picker — only shown when the tour exposes one or
                  more startTimes. Tours with no schedule (Bokun "request
                  only") fall back to the date picker + a request CTA. */}
              {Array.isArray(tour.times) && tour.times.length > 0 && (
              <label className="field" style={{ marginTop: 14 }}>
                <span className="mono">{t.time}</span>
                <div style={{ display:'flex', gap: 6, flexWrap:'wrap' }}>
                  {tour.times.map((tm,i) => {
                    const isSel = selTime === tm;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={()=>setSelTime(tm)}
                        className={`time-chip${isSel ? ' is-selected' : ''}`}
                        style={{
                          padding: '8px 14px', borderRadius: 999,
                          border: `1.5px solid ${isSel ? 'var(--ink)' : 'var(--line)'}`,
                          background: isSel ? 'var(--ink)' : 'transparent', color: isSel ? 'var(--bone)' : 'var(--ink)',
                          cursor:'pointer', fontSize: 13, fontWeight: 500,
                          transition: 'background-color 140ms ease, border-color 140ms ease, transform 140ms ease',
                        }}
                      >{tm}</button>
                    );
                  })}
                </div>
              </label>
              )}

              {/* People (not for flat vans). Three tiers in one row to
                  conserve vertical space — labels stack above each
                  compact stepper. Surfaced even when there's no kid/
                  infant pricing so the operator gets an accurate
                  manifest. */}
              {!tour.flat && (
                <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  <div>
                    <div className="mono" style={{ fontSize: 11, color: 'var(--ink)' }}>{t.adults}</div>
                    <div style={{ fontSize: 10, color: 'var(--ink-soft)', marginBottom: 4 }}>{t.adultsAge}</div>
                    <Stepper value={adults} setValue={setAdults} min={1} max={12} compact/>
                  </div>
                  <div>
                    <div className="mono" style={{ fontSize: 11, color: 'var(--ink)' }}>{t.kids}</div>
                    <div style={{ fontSize: 10, color: 'var(--ink-soft)', marginBottom: 4 }}>{t.kidsAge}</div>
                    <Stepper value={kids} setValue={setKids} min={0} max={10} compact/>
                  </div>
                  <div>
                    <div className="mono" style={{ fontSize: 11, color: 'var(--ink)' }}>{t.infants}</div>
                    <div style={{ fontSize: 10, color: 'var(--ink-soft)', marginBottom: 4 }}>{t.infantsAge}</div>
                    <Stepper value={infants} setValue={setInfants} min={0} max={6} compact/>
                  </div>
                </div>
              )}

              {/* Add-ons (only rendered when there's something to show). */}
              {addonList.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <span className="mono" style={{ color:'var(--ink-soft)', display:'block', marginBottom: 8 }}>{t.addOns}</span>
                <div style={{ display:'flex', flexDirection:'column', gap: 6 }}>
                  {addonList.map(a => {
                    const checked = !!addons[a.k];
                    return (
                      <label
                        key={a.k}
                        className={`addon-row${checked ? ' is-checked' : ''}`}
                        style={{
                          display:'flex', alignItems:'center', gap: 10,
                          padding: '8px 10px',
                          border: `1px solid ${checked ? 'var(--lagoon)' : 'var(--line)'}`,
                          background: checked ? 'rgba(184,232,238,0.35)' : 'transparent',
                          borderRadius: 8, cursor:'pointer',
                          transition: 'background-color 140ms ease, border-color 140ms ease',
                        }}
                      >
                        <input type="checkbox" checked={checked} onChange={(e)=>setAddons({...addons, [a.k]: e.target.checked})}/>
                        <span style={{ flex: 1, fontSize: 13 }}>{a.label}</span>
                        <span className="mono" style={{ color:'var(--ink-soft)' }}>+${a.price}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              )}

              {/* Optional transport. Each option is a route_price priced
                  by a vendor (e.g., Taxis Bacalar). Selecting one unlocks
                  a free-text pickup address required before booking. */}
              {transportOptions.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <span className="mono" style={{ color:'var(--ink-soft)', display:'block', marginBottom: 8 }}>
                    {t.transportSection}
                  </span>
                  <div style={{ display:'flex', flexDirection:'column', gap: 6 }}>
                    {/* "No transport" choice — tour pickup zones aren't
                        used for these tours; the customer goes to the
                        meeting point on their own. */}
                    <label
                      className={`addon-row${selectedTransport === null ? ' is-checked' : ''}`}
                      style={{
                        display:'flex', alignItems:'flex-start', gap: 10,
                        padding: '10px 12px',
                        border: `1px solid ${selectedTransport === null ? 'var(--lagoon)' : 'var(--line)'}`,
                        background: selectedTransport === null ? 'rgba(184,232,238,0.35)' : 'transparent',
                        borderRadius: 8, cursor:'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name="transport-choice"
                        checked={selectedTransport === null}
                        onChange={()=>{ setSelectedTransport(null); setPickupAddressTouched(false); setPickupOutOfZone(false); }}
                        style={{ marginTop: 3 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{t.transportNone}</div>
                        <div style={{ fontSize: 11, color:'var(--ink-soft)', marginTop: 2 }}>{t.transportNoneSub}</div>
                      </div>
                      <span className="mono" style={{ color:'var(--ink-soft)' }}>{t.transportFree}</span>
                    </label>

                    {transportOptions.map((opt) => {
                      const isSel = selectedTransport?.id === opt.id;
                      const cap = opt.vehicle?.passengerCapacity || 1;
                      const info = _transportTotalInTourCurrency(opt, _pax);
                      const dirLabel = opt.defaultDirection === 'round_trip' ? t.transportRoundTrip : t.transportOneWay;
                      const labelText = opt.label?.[lang] || opt.label?.en || opt.vehicle?.name || 'Pickup';
                      const descText = opt.description?.[lang] || opt.description?.en || '';
                      // Pick the right vehicle icon + accent color from
                      // serviceType. Taxi gets the lucide taxi glyph on a
                      // bright "real-taxi-yellow" tile that gently jiggles
                      // on appear/hover (see .taxi-tile in styles.css).
                      const svc = opt.vehicle?.serviceType;
                      const isTaxi = svc === 'taxi';
                      const iconKey = isTaxi ? 'taxi' : svc === 'shuttle' ? 'bus' : 'van';
                      return (
                        <label
                          key={opt.id}
                          className={`addon-row${isSel ? ' is-checked' : ''}`}
                          style={{
                            display:'flex', alignItems:'center', gap: 8,
                            padding: '8px 10px',
                            border: `1px solid ${isSel ? 'var(--lagoon)' : 'var(--line)'}`,
                            background: isSel ? 'rgba(184,232,238,0.35)' : 'transparent',
                            borderRadius: 8, cursor:'pointer',
                          }}
                        >
                          <input
                            type="radio"
                            name="transport-choice"
                            checked={isSel}
                            onChange={()=>{ setSelectedTransport(opt); setPickupAddressTouched(false); setPickupOutOfZone(false); }}
                          />
                          <div
                            aria-hidden
                            className={isTaxi ? 'taxi-tile' : ''}
                            style={{
                              width: 30, height: 30, borderRadius: 7,
                              background: isTaxi ? '#ffd11a' : 'var(--bone-2)',
                              color: isTaxi ? '#1a1a1a' : 'var(--ink-soft)',
                              boxShadow: isTaxi ? '0 1px 0 #b8901a, inset 0 -1px 0 rgba(0,0,0,0.06)' : 'none',
                              display:'flex', alignItems:'center', justifyContent:'center',
                              flexShrink: 0,
                            }}
                          >
                            <Icon d={icons[iconKey]} size={18}/>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{labelText}</div>
                            {descText && (
                              <div style={{ fontSize: 11, color:'var(--ink-soft)', marginTop: 1 }}>{descText}</div>
                            )}
                            <div className="mono" style={{ fontSize: 10, color:'var(--ink-soft)', marginTop: 3 }}>
                              {dirLabel}
                              {info.vehicleCount > 1 && ` · ${info.vehicleCount}× (${cap} pax/v)`}
                            </div>
                          </div>
                          <span className="mono" style={{ color:'var(--ink-soft)' }}>
                            +${(info.cents / 100).toLocaleString()}
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  {selectedTransport && (
                    <div style={{ marginTop: 10 }}>
                      <label className="mono" style={{ display:'block', fontSize: 11, color:'var(--ink-soft)', marginBottom: 4 }}>
                        {t.transportPickupAddressLabel}
                      </label>
                      <input
                        ref={pickupInputRef}
                        type="text"
                        value={pickupAddress}
                        onChange={(e)=>{
                          setPickupAddress(e.target.value);
                          setPickupCoords(null); // typing invalidates coords until next pick
                          setPickupOutOfZone(false);
                          setPickupAddressTouched(true);
                        }}
                        onBlur={()=>setPickupAddressTouched(true)}
                        placeholder={t.transportPickupAddressPlaceholder}
                        autoComplete="off"
                        style={{
                          width:'100%', padding: '10px 12px', borderRadius: 8,
                          border: `1px solid ${
                            pickupOutOfZone || (pickupAddressTouched && !pickupAddress.trim())
                              ? '#dc2626'
                              : 'var(--line-strong)'
                          }`,
                          fontFamily: 'inherit', fontSize: 13,
                          background:'var(--bone)',
                        }}
                      />
                      {pickupAddressTouched && !pickupAddress.trim() && (
                        <div style={{ color:'#dc2626', fontSize: 11, marginTop: 4 }}>
                          {t.transportPickupAddressRequired}
                        </div>
                      )}
                      {pickupOutOfZone && (
                        <div style={{ color:'#dc2626', fontSize: 11, marginTop: 4 }}>
                          {t.transportOutOfZone?.replace('{zone}', selectedTransport?.serviceArea?.name || '')
                            || (lang==='en'
                              ? `That address is outside the pickup area (${selectedTransport?.serviceArea?.name || 'service zone'}). Pick a closer hotel or address.`
                              : `Esa dirección está fuera de la zona de recogida (${selectedTransport?.serviceArea?.name || 'zona de servicio'}). Elige un hotel o dirección más cercana.`)}
                        </div>
                      )}
                      {pickupCoords && !pickupOutOfZone && (
                        <div className="mono" style={{ fontSize: 10, color:'var(--ink-soft)', marginTop: 4 }}>
                          <Icon d={icons.pin} size={9}/> {pickupCoords.lat.toFixed(5)}, {pickupCoords.lng.toFixed(5)}
                          {selectedTransport?.serviceArea?.name && ` · ${lang==='en'?'in':'en'} ${selectedTransport.serviceArea.name}`}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Total */}
              <div style={{ marginTop: 18, padding: 14, background:'var(--ink)', color:'var(--bone)', borderRadius: 10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span className="mono" style={{ opacity: 0.8 }}>{t.total}</span>
                <span className="display" style={{ fontSize: 28 }}>${total.toLocaleString()}</span>
              </div>

              {(() => {
                // Build the cart lines for whichever button the customer
                // clicks. When a transport option is selected we emit a
                // separate `kind: 'transfer'` line so the cart drawer +
                // backend can keep the items distinct.
                const buildLines = () => {
                  const tourSubtotal = total - _transportSubtotal;
                  const tourLine = {
                    tourId: tour.id,
                    adults, kids, infants, addons,
                    date: selDate, time: selTime,
                    subtotal: tourSubtotal,
                    pickup,
                  };
                  if (!selectedTransport) return [tourLine];
                  const opt = selectedTransport;
                  const isRoundTrip = opt.defaultDirection === 'round_trip';
                  const transferLine = {
                    kind: 'transfer',
                    serviceType: isRoundTrip ? 'round_trip' : 'point_to_point',
                    roundTrip: isRoundTrip,
                    origin: {
                      address: pickupAddress.trim(),
                      ...(pickupCoords ? { lat: pickupCoords.lat, lng: pickupCoords.lng } : {}),
                    },
                    destination: { address: opt.label?.[lang] || opt.vehicle?.name || 'Tour meeting point' },
                    pax: _pax,
                    luggage: 0,
                    vehicleId: opt.vehicle.id,
                    vehicleName: opt.vehicle.name,
                    routePriceId: opt.pricing.routePriceId,
                    addons: [],
                    currency: tour.defaultCurrency || 'USD',
                    subtotal: _transportSubtotal,
                    _displayLabel: opt.label?.[lang] || opt.label?.en || opt.vehicle?.name,
                    _displayDescription: opt.description?.[lang] || opt.description?.en,
                    _vehicleCount: _transportInfo.vehicleCount,
                    _tourId: tour.id,
                  };
                  return [tourLine, transferLine];
                };
                const onBookNow = () => {
                  const lines = buildLines();
                  if (lines.length > 1) {
                    navigate('booking', { cart: lines });
                  } else {
                    navigate('booking', { tourId: tour.id, adults, kids, infants, addons, date: selDate, time: selTime, total, pickup });
                  }
                };
                const onAddToCart = () => {
                  const lines = buildLines();
                  // Last addToCart opens the drawer; preceding ones stay silent
                  // to avoid flicker.
                  lines.forEach((line, i) => addToCart(line, { silent: i < lines.length - 1 }));
                };
                return (
                  <>
                    <button disabled={!canBook} className="btn btn-sun btn-lg" style={{ width:'100%', marginTop: 14, opacity: canBook ? 1 : 0.5 }}
                      onClick={onBookNow}>
                      {t.bookNowAlt || t.continue} <Icon d={icons.arrow} size={14}/>
                    </button>
                    <button disabled={!canBook} className="btn btn-outline" style={{ width:'100%', marginTop: 8, opacity: canBook ? 1 : 0.5 }}
                      onClick={onAddToCart}>
                      <Icon d={icons.bag} size={14}/> {t.addToCart}
                    </button>
                  </>
                );
              })()}
              <div style={{ textAlign:'center', marginTop: 10, fontSize: 11, color:'var(--ink-soft)' }}>
                {lang==='en'?'Free cancellation up to 24hrs before':'Cancelación gratis 24hrs antes'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Stepper = ({ value, setValue, min = 0, max = 20, compact = false }) => {
  const sz = compact ? 30 : 40;
  return (
    <div className="stepper" style={{ display:'flex', alignItems:'center', border: '1.5px solid var(--line-strong)', borderRadius: compact ? 8 : 10, width: 'fit-content' }}>
      <button
        type="button"
        className="stepper-btn"
        disabled={value <= min}
        onClick={()=>setValue(Math.max(min, value-1))}
        style={{ width: sz, height: sz, border:'none', background:'transparent', cursor: value <= min ? 'not-allowed' : 'pointer', color: value <= min ? 'var(--ink-soft)' : 'var(--ink)', display:'flex', alignItems:'center', justifyContent:'center', borderTopLeftRadius: 'inherit', borderBottomLeftRadius: 'inherit', transition: 'background-color 140ms ease' }}
      >
        <Icon d={icons.minus} size={compact ? 12 : 14}/>
      </button>
      <span style={{ width: sz, textAlign:'center', fontWeight: 600, fontSize: compact ? 13 : 16 }}>{value}</span>
      <button
        type="button"
        className="stepper-btn"
        disabled={value >= max}
        onClick={()=>setValue(Math.min(max, value+1))}
        style={{ width: sz, height: sz, border:'none', background:'transparent', cursor: value >= max ? 'not-allowed' : 'pointer', color: value >= max ? 'var(--ink-soft)' : 'var(--ink)', display:'flex', alignItems:'center', justifyContent:'center', borderTopRightRadius: 'inherit', borderBottomRightRadius: 'inherit', transition: 'background-color 140ms ease' }}
      >
        <Icon d={icons.plus} size={compact ? 12 : 14}/>
      </button>
    </div>
  );
};

window.TourDetail = TourDetail;
window.Stepper = Stepper;
