// Tour detail page — gallery, specs, reviews, booking panel
const TourDetail = ({ tourId, prefill }) => {
  const { t, lang, navigate, addToCart, openLightbox } = useT();
  const tour = window.TOURS.find(x => x.id === tourId) || window.TOURS[0];
  const [adults, setAdults] = useState(2);
  const [kids, setKids] = useState(0);
  const [infants, setInfants] = useState(0);
  const [selDate, setSelDate] = useState(prefill?.prefillDate || null);
  const [selTime, setSelTime] = useState(
    prefill?.prefillTime && tour.times && tour.times.includes(prefill.prefillTime)
      ? prefill.prefillTime
      : null
  );
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [addons, setAddons] = useState({});
  const hasPickups = Array.isArray(tour.pickupPoints) && tour.pickupPoints.length > 1;
  const [pickupIdx, setPickupIdx] = useState(0);
  const pickup = (Array.isArray(tour.pickupPoints) && tour.pickupPoints[pickupIdx]) || null;
  const pickupSurcharge = pickup?.surcharge || 0;

  const gallery = window.tourGallery(tour);

  const addonList = [
    { k: 'hotel', label: lang==='en'?'Hotel pickup':'Traslado hotel', price: 15 },
    { k: 'photo', label: lang==='en'?'Pro photo pack (50 photos)':'Pack de fotos pro (50)', price: 25 },
    { k: 'lunch', label: lang==='en'?'Upgrade to premium lunch':'Upgrade almuerzo premium', price: 18 }
  ];

  // Infants are free by default. If a tenant later wires up
  // TourZonePrice rows with paxCategory='infant' the price calc will
  // need updating, but for now they're a manifest-only count for the
  // operator (so they know how many car seats / how full the boat is).
  const total = (tour.flat
    ? tour.priceAdult + Object.keys(addons).filter(k=>addons[k]).reduce((a,k)=>a+(addonList.find(x=>x.k===k)?.price||0)*1,0)
    : adults * tour.priceAdult + kids * (tour.priceKid||0) + (adults+kids) * Object.keys(addons).filter(k=>addons[k]).reduce((a,k)=>a+(addonList.find(x=>x.k===k)?.price||0),0)
  ) + pickupSurcharge;

  const tourReviews = window.REVIEWS.filter(r => r.tour === tour.id).concat(window.REVIEWS.filter(r => r.tour !== tour.id).slice(0,2));

  // Pull schedule + blackout config straight off the loaded tour. The
  // catalog API hydrates these when ensureDetail() runs (data-api.js),
  // so by the time this page renders we usually have them. Defaults
  // mean the picker degrades gracefully if they haven't arrived yet.
  const cutoffHours = tour.schedules?.[0]?.cutoffHoursBefore ?? 24;

  const canBook = selDate && selTime && (tour.flat || adults > 0);

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
                style={{
                  gridRow: heroBigSpansBothRows ? 'span 2' : 'auto',
                  position: 'relative',
                  cursor: 'zoom-in',
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
                  style={{ cursor: 'zoom-in' }}
                  onClick={() => openLightbox(gallery, i + 1)}
                >
                  <window.Photo
                    src={g.src}
                    label={g.label}
                    style={{ width: '100%', height: '100%', borderRadius: 'var(--radius)' }}
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
            </div>
            <h1 className="display" style={{ fontSize: 56, margin: 0, lineHeight: 0.95, letterSpacing: '-0.03em' }}>
              {tour.title[lang]}
            </h1>
            <p style={{ fontSize: 20, color: 'var(--ink-soft)', marginTop: 16 }}>{tour.tagline[lang]}</p>

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
                  <div className="display" style={{ fontSize: 40 }}>${tour.priceAdult}</div>
                  <div className="mono" style={{ color:'var(--ink-soft)' }}>{tour.flat ? t.perVan : t.perPerson}</div>
                </div>
                <span className="badge lagoon dot" style={{ flexShrink: 0 }}>{lang==='en'?'available today':'disponible hoy'}</span>
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

              {/* Time */}
              <label className="field" style={{ marginTop: 14 }}>
                <span className="mono">{t.time}</span>
                <div style={{ display:'flex', gap: 6, flexWrap:'wrap' }}>
                  {tour.times.map((tm,i) => {
                    const isSel = selTime === tm;
                    return (
                      <button key={i} onClick={()=>setSelTime(tm)} style={{
                        padding: '8px 14px', borderRadius: 999,
                        border: `1.5px solid ${isSel ? 'var(--ink)' : 'var(--line)'}`,
                        background: isSel ? 'var(--ink)' : 'transparent', color: isSel ? 'var(--bone)' : 'var(--ink)',
                        cursor:'pointer', fontSize: 13, fontWeight: 500
                      }}>{tm}</button>
                    );
                  })}
                </div>
              </label>

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

              {/* Add-ons */}
              <div style={{ marginTop: 16 }}>
                <span className="mono" style={{ color:'var(--ink-soft)', display:'block', marginBottom: 8 }}>{t.addOns}</span>
                <div style={{ display:'flex', flexDirection:'column', gap: 6 }}>
                  {addonList.map(a => (
                    <label key={a.k} style={{ display:'flex', alignItems:'center', gap: 10, padding: '8px 10px', border: '1px solid var(--line)', borderRadius: 8, cursor:'pointer' }}>
                      <input type="checkbox" checked={!!addons[a.k]} onChange={(e)=>setAddons({...addons, [a.k]: e.target.checked})}/>
                      <span style={{ flex: 1, fontSize: 13 }}>{a.label}</span>
                      <span className="mono" style={{ color:'var(--ink-soft)' }}>+${a.price}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div style={{ marginTop: 18, padding: 14, background:'var(--ink)', color:'var(--bone)', borderRadius: 10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span className="mono" style={{ opacity: 0.8 }}>{t.total}</span>
                <span className="display" style={{ fontSize: 28 }}>${total.toLocaleString()}</span>
              </div>

              <button disabled={!canBook} className="btn btn-sun btn-lg" style={{ width:'100%', marginTop: 14, opacity: canBook ? 1 : 0.5 }}
                onClick={() => navigate('booking', { tourId: tour.id, adults, kids, infants, addons, date: selDate, time: selTime, total, pickup })}>
                {t.bookNowAlt || t.continue} <Icon d={icons.arrow} size={14}/>
              </button>
              <button disabled={!canBook} className="btn btn-outline" style={{ width:'100%', marginTop: 8, opacity: canBook ? 1 : 0.5 }}
                onClick={() => addToCart({ tourId: tour.id, adults, kids, infants, addons, date: selDate, time: selTime, subtotal: total, pickup })}>
                <Icon d={icons.bag} size={14}/> {t.addToCart}
              </button>
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
    <div style={{ display:'flex', alignItems:'center', border: '1.5px solid var(--line-strong)', borderRadius: compact ? 8 : 10, width: 'fit-content' }}>
      <button type="button" onClick={()=>setValue(Math.max(min, value-1))} style={{ width: sz, height: sz, border:'none', background:'transparent', cursor:'pointer', color: value <= min ? 'var(--ink-soft)' : 'var(--ink)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Icon d={icons.minus} size={compact ? 12 : 14}/>
      </button>
      <span style={{ width: sz, textAlign:'center', fontWeight: 600, fontSize: compact ? 13 : 16 }}>{value}</span>
      <button type="button" onClick={()=>setValue(Math.min(max, value+1))} style={{ width: sz, height: sz, border:'none', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Icon d={icons.plus} size={compact ? 12 : 14}/>
      </button>
    </div>
  );
};

window.TourDetail = TourDetail;
window.Stepper = Stepper;
