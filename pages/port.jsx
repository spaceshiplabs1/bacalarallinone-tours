// Port quick-book flow — for cruise day-trippers
const PortFlow = ({ navigate }) => {
  const { t, lang, navigate: nav, addToCart } = useT();
  const [step, setStep] = useState(1);
  const [ship, setShip] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));

  const portTours = window.TOURS.filter(x => x.audience.includes('port'));

  return (
    <div className="fade-in">
      {/* Hero band — single sunset shot of the Mahahual cruise pier.
          Horizontal gradient overlay (dark on the left where the
          headline sits, transparent on the right where the cruise
          ship is) so the photo's subject keeps its natural light
          instead of being uniformly darkened. */}
      <section style={{ color: 'var(--bone)', padding: '90px 0 110px', position:'relative', overflow:'hidden', background: 'var(--ink)', minHeight: 380 }}>
        <div
          aria-hidden
          style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'url(./images/port-hero-sunset.webp)',
            backgroundSize: 'cover',
            backgroundPosition: 'center 55%',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute', inset: 0,
            background:
              'linear-gradient(90deg, rgba(0,0,0,0.58) 0%, rgba(0,0,0,0.32) 35%, rgba(0,0,0,0) 65%),' +
              'linear-gradient(180deg, rgba(0,0,0,0) 65%, rgba(0,0,0,0.30) 100%)',
          }}
        />
        <div className="container" style={{ position:'relative' }}>
          <div
            className="mono"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(12,42,46,0.55)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              color: 'var(--sun)',
              padding: '6px 12px',
              borderRadius: 999,
              marginBottom: 14,
              fontSize: 11,
              letterSpacing: 1.6,
            }}
          >
            ● PORT DAY · MAHAHUAL · COSTA MAYA
          </div>
          <h1 className="display" style={{ fontSize: 'clamp(40px, 5vw, 72px)', margin: 0, lineHeight: 0.95, maxWidth: 900, textShadow: '0 2px 16px rgba(0,0,0,0.5)' }}>
            {lang==='en'
              ? <>Off the ship at 9. <span style={{color:'var(--sun)'}}>Back by 2:30.</span> Nothing in-between wasted.</>
              : <>Bajas a las 9. <span style={{color:'var(--sun)'}}>De vuelta 2:30.</span> Ni un minuto perdido.</>}
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(245,240,230,0.92)', marginTop: 18, maxWidth: 620, textShadow: '0 1px 8px rgba(0,0,0,0.55)' }}>
            {lang==='en'
              ? 'Short, sharp adventures within 45 min of the Mahahual pier. Guides who know your ship\'s departure time better than your concierge.'
              : 'Aventuras cortas e intensas a máx. 45 min del muelle Mahahual. Guías que conocen tu crucero mejor que el concierge del barco.'}
          </p>
          <div style={{ display:'flex', gap: 10, marginTop: 24, flexWrap:'wrap' }}>
            <span className="badge" style={{ background:'var(--sun)', color:'var(--ink)' }}>
              <Icon d={icons.shield} size={10}/> BACK-TO-SHIP GUARANTEE
            </span>
            <span className="badge" style={{ background:'rgba(255,255,255,0.20)', color:'var(--bone)', backdropFilter: 'blur(4px)' }}>
              <Icon d={icons.clock} size={10}/> SAME-DAY BOOKING OK
            </span>
            <span className="badge" style={{ background:'rgba(255,255,255,0.20)', color:'var(--bone)', backdropFilter: 'blur(4px)' }}>
              <Icon d={icons.pin} size={10}/> 5-MIN PIER PICKUP
            </span>
          </div>
        </div>
      </section>

      <div className="container port-stepper-wrap" style={{ marginTop: -40, position:'relative', paddingBottom: 60 }}>
        {/* Stepper card */}
        <div className="card" style={{ padding: 28, boxShadow: 'var(--shadow)' }}>
          <div style={{ display:'flex', gap: 6, marginBottom: 28 }}>
            {[1,2,3].map(s => (
              <div key={s} style={{
                flex: 1, height: 4, borderRadius: 2,
                background: step >= s ? 'var(--lagoon)' : 'var(--line)'
              }}/>
            ))}
          </div>

          {step === 1 && (
            <div className="fade-in">
              <div className="mono" style={{ color:'var(--ink-soft)', marginBottom: 8 }}>STEP 01</div>
              <h2 className="display" style={{ fontSize: 32, margin: 0 }}>{t.portStepShip}</h2>
              <p style={{ color:'var(--ink-soft)', marginTop: 8, marginBottom: 24 }}>
                {lang==='en'?'Pick your cruise ship. We auto-set pickup & return windows.':'Elige tu crucero. Ajustamos recogida y regreso.'}
              </p>
              <div className="rg-3" style={{ display:'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {window.CRUISE_SHIPS.map(s => (
                  <button key={s.name} onClick={()=>{ setShip(s); setStep(2); }} style={{
                    textAlign:'left', padding: 16, borderRadius: 12,
                    border: `1.5px solid ${ship?.name === s.name ? 'var(--ink)' : 'var(--line)'}`,
                    background: ship?.name === s.name ? 'var(--bone-2)' : 'transparent',
                    cursor:'pointer'
                  }}>
                    <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
                      <Icon d={icons.ship} size={18}/>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                    </div>
                    <div className="mono" style={{ color:'var(--ink-soft)', marginTop: 8 }}>
                      IN {s.arrive} · OUT {s.depart}
                    </div>
                  </button>
                ))}
                <button style={{ padding: 16, borderRadius: 12, border:'1.5px dashed var(--line-strong)', background:'transparent', cursor:'pointer', color:'var(--ink-soft)', textAlign:'left' }}>
                  {lang==='en'?'Other ship →':'Otro barco →'}
                </button>
              </div>
            </div>
          )}

          {step === 2 && ship && (
            <div className="fade-in">
              <div className="mono" style={{ color:'var(--ink-soft)', marginBottom: 8 }}>STEP 02</div>
              <h2 className="display" style={{ fontSize: 32, margin: 0 }}>{t.portStepDate}</h2>
              <div className="rg-3" style={{ display:'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 20 }}>
                <div style={{ padding: 16, background: 'var(--bone-2)', borderRadius: 10 }}>
                  <div className="mono" style={{ color:'var(--ink-soft)' }}>{t.portInPort}</div>
                  <div className="display" style={{ fontSize: 28, marginTop: 4 }}>{ship.arrive}</div>
                </div>
                <div style={{ padding: 16, background:'var(--sun)', color:'var(--ink)', borderRadius: 10 }}>
                  <div className="mono" style={{ opacity: 0.7 }}>{t.portWeBring}</div>
                  <div className="display" style={{ fontSize: 28, marginTop: 4 }}>
                    {addHours(ship.depart, -1)}
                  </div>
                </div>
                <div style={{ padding: 16, background: 'var(--ink)', color:'var(--bone)', borderRadius: 10 }}>
                  <div className="mono" style={{ opacity: 0.7 }}>{t.portDeparts}</div>
                  <div className="display" style={{ fontSize: 28, marginTop: 4 }}>{ship.depart}</div>
                </div>
              </div>
              <label className="field" style={{ marginTop: 20 }}>
                <span className="mono">{t.date}</span>
                <input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)}/>
              </label>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop: 24 }}>
                <button className="btn btn-ghost" onClick={()=>setStep(1)}><Icon d={icons.chevronLeft} size={14}/> {t.back}</button>
                <button className="btn btn-primary" onClick={()=>setStep(3)}>{t.continue} <Icon d={icons.arrow} size={14}/></button>
              </div>
            </div>
          )}

          {step === 3 && ship && (
            <div className="fade-in">
              <div className="mono" style={{ color:'var(--ink-soft)', marginBottom: 8 }}>STEP 03</div>
              <h2 className="display" style={{ fontSize: 32, margin: 0 }}>{t.portStepTour}</h2>
              <div style={{ display:'flex', alignItems:'center', gap: 8, marginTop: 10, marginBottom: 20, flexWrap:'wrap' }}>
                <span className="chip active"><Icon d={icons.ship} size={12}/> {ship.name}</span>
                <span className="chip"><Icon d={icons.calendar} size={12}/> {date}</span>
                <span className="chip sun"><Icon d={icons.clock} size={12}/> {lang==='en'?'Return by':'Regreso'} {addHours(ship.depart, -1)}</span>
                <button className="chip" style={{cursor:'pointer', border:'1px solid var(--line)'}} onClick={()=>setStep(1)}>{lang==='en'?'Change':'Cambiar'}</button>
              </div>
              <div className="rg-port-tours" style={{ display:'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                {portTours.map(tour => {
                  const fits = computeFits(tour, ship);
                  return (
                    <div key={tour.id} className="card" style={{ padding: 0, cursor:'pointer', position:'relative' }} onClick={()=>nav('detail', { tourId: tour.id, prefillDate: date, prefillTime: tour.times && tour.times[0], shipName: ship.name })}>
                      <div style={{ display:'flex' }}>
                        <window.Photo src={window.tourPhoto(tour)} label={tour.phLabel} style={{ width: 140, flexShrink: 0 }}/>
                        <div style={{ padding: 16, flex: 1 }}>
                          <h3 className="display" style={{ fontSize: 18, margin: 0 }}>{tour.title[lang]}</h3>
                          <div className="mono" style={{ color:'var(--ink-soft)', marginTop: 6 }}>
                            <Icon d={icons.clock} size={10}/> {tour.duration}h · FITS: {fits.ok ? '✓' : '✗'}
                          </div>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginTop: 12 }}>
                            <div>
                              <span className="display" style={{ fontSize: 22 }}>${tour.priceAdult}</span>
                              <span style={{ color:'var(--ink-soft)', fontSize: 12, marginLeft: 4 }}>/ pax</span>
                            </div>
                            <span className="badge" style={{ background: fits.ok ? 'var(--lagoon)' : 'var(--clay)', color: fits.ok?'var(--ink)':'var(--bone)' }}>
                              {fits.back}
                            </span>
                          </div>
                          {fits.ok && (
                            <button onClick={(e)=>{
                              e.stopPropagation();
                              const time = tour.times && tour.times[0];
                              const adults = tour.flat ? 1 : 2;
                              const subtotal = tour.flat ? tour.priceAdult : adults * tour.priceAdult;
                              addToCart({ tourId: tour.id, adults, kids: 0, addons: {}, date, time, subtotal }, { silent: true });
                            }}
                              className="btn btn-outline btn-sm" style={{ marginTop: 10, width:'100%' }}>
                              <Icon d={icons.plus} size={14}/> {t.addToCart}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Reassurance band */}
        <div className="rg-3" style={{ display:'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 28 }}>
          {[
            { icon: icons.shield, t: lang==='en'?'Miss the ship? We fly you free to the next port.':'¿Pierdes el barco? Te volamos al siguiente puerto.' },
            { icon: icons.clock, t: lang==='en'?'All tours end minimum 1hr before ship departure.':'Todos los tours terminan mín. 1hr antes de zarpar.' },
            { icon: icons.pin, t: lang==='en'?'Meet our agent at pier exit with a "bacalar" sign.':'Nos encuentras en la salida del muelle con letrero "bacalar".' }
          ].map((r,i) => (
            <div key={i} style={{ padding: 20, background:'var(--bone-2)', borderRadius: 12, display:'flex', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius:'50%', background:'var(--sun)', color:'var(--ink)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon d={r.icon} size={16}/>
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.5 }}>{r.t}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

function addHours(timeStr, h) {
  const [hh, mm] = timeStr.split(':').map(Number);
  let total = hh * 60 + mm + h * 60;
  if (total < 0) total += 1440;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2,'0')}:${String(nm).padStart(2,'0')}`;
}

function computeFits(tour, ship) {
  const back = tour.portReturn || '14:00';
  const departMins = parseInt(ship.depart.split(':')[0]) * 60 + parseInt(ship.depart.split(':')[1]);
  const backMins = parseInt(back.split(':')[0]) * 60 + parseInt(back.split(':')[1]);
  return { ok: backMins + 60 <= departMins, back: `◎ ${back}` };
}

window.PortFlow = PortFlow;
