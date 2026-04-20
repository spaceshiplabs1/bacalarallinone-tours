// Transfers (airport vans) + Map pages
const Transfers = () => {
  const { t, lang, navigate } = useT();
  const [from, setFrom] = useState('CUN');
  const [to, setTo] = useState('Bacalar');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [pax, setPax] = useState(2);
  const [roundtrip, setRoundtrip] = useState(false);

  const transfers = window.TOURS.filter(x => x.category === 'transfer');
  const price = from === 'CUN' ? 220 : from === 'TQO' ? 140 : 180;
  const total = roundtrip ? price * 2 : price;

  return (
    <div className="fade-in">
      <section style={{ background: 'var(--jungle)', color: 'var(--bone)', padding: '56px 0 80px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset: 0, background: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.03) 0 2px, transparent 2px 18px)' }}/>
        <div className="container" style={{ position:'relative' }}>
          <div className="mono" style={{ color: 'var(--sun)', marginBottom: 14 }}>AIRPORT TRANSFERS · 24/7</div>
          <h1 className="display" style={{ fontSize: 'clamp(44px, 5.5vw, 80px)', margin: 0, lineHeight: 0.95, maxWidth: 900 }}>
            {lang==='en' ? <>Door-to-door, <span style={{color:'var(--sun)'}}>any hour.</span></> : <>De puerta a puerta, <span style={{color:'var(--sun)'}}>cualquier hora.</span></>}
          </h1>
          <p style={{ fontSize: 17, opacity: 0.85, marginTop: 18, maxWidth: 620 }}>
            {lang==='en'
              ? 'Private AC vans from Cancún (CUN) and Tulum (TQO) airports. Flight tracking, bilingual driver, cold water, free wifi. Child seats on request.'
              : 'Vans privadas con AC desde Cancún (CUN) y Tulum (TQO). Rastreo de vuelos, chofer bilingüe, agua fría, wifi. Sillas de bebé disponibles.'}
          </p>
        </div>
      </section>

      <div className="container" style={{ marginTop: -50, position:'relative', paddingBottom: 50 }}>
        <div className="card" style={{ padding: 24, boxShadow: 'var(--shadow)' }}>
          <div className="rg-transfers-form" style={{ display:'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr auto', gap: 10, alignItems:'flex-end' }}>
            <label className="field"><span className="mono">{lang==='en'?'FROM':'DESDE'}</span>
              <select className="select" value={from} onChange={e=>setFrom(e.target.value)}>
                <option value="CUN">Cancún Airport (CUN)</option>
                <option value="TQO">Tulum Airport (TQO)</option>
                <option value="MAH">Mahahual Port</option>
                <option value="BAC">Bacalar</option>
              </select>
            </label>
            <label className="field"><span className="mono">{lang==='en'?'TO':'HACIA'}</span>
              <select className="select" value={to} onChange={e=>setTo(e.target.value)}>
                {['Bacalar','Mahahual','Tulum','Playa del Carmen','Chetumal'].map(c => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="field"><span className="mono">{t.date}</span>
              <input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)}/>
            </label>
            <label className="field"><span className="mono">{t.time}</span>
              <input className="input" type="time" value={time} onChange={e=>setTime(e.target.value)}/>
            </label>
            <label className="field"><span className="mono">PAX</span>
              <Stepper value={pax} setValue={setPax} min={1} max={14}/>
            </label>
            <button className="btn btn-primary btn-lg">{lang==='en'?'Search':'Buscar'} <Icon d={icons.arrow} size={14}/></button>
          </div>
          <label style={{ display:'flex', alignItems:'center', gap: 8, marginTop: 14, fontSize: 13 }}>
            <input type="checkbox" checked={roundtrip} onChange={e=>setRoundtrip(e.target.checked)}/>
            {lang==='en'?'Round-trip (save 10%)':'Viaje redondo (ahorra 10%)'}
          </label>
        </div>

        {/* Result preview */}
        <div className="rg" style={{ display:'grid', gridTemplateColumns: '1.3fr 1fr', gap: 24, marginTop: 24 }}>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div className="mono" style={{ color:'var(--ink-soft)' }}>PRIVATE VAN · UP TO 8 PAX</div>
                <h2 className="display" style={{ fontSize: 28, margin: '8px 0 0' }}>
                  {from} → {to}
                </h2>
                <p style={{ color:'var(--ink-soft)', marginTop: 6, fontSize: 14 }}>
                  {lang==='en'?'Estimated 3h 45m drive · meet driver inside arrivals with your name on sign.':'Viaje ~3h 45m · encuentra al chofer en llegadas con tu nombre en letrero.'}
                </p>
              </div>
              <div style={{ textAlign:'right' }}>
                <div className="display" style={{ fontSize: 40 }}>${total}</div>
                <div className="mono" style={{ color:'var(--ink-soft)' }}>{t.perVan}</div>
              </div>
            </div>

            {/* Route visual */}
            <div style={{ marginTop: 24, display:'flex', alignItems:'center', gap: 16, padding: 20, background:'var(--bone-2)', borderRadius: 12 }}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                <div style={{ width: 14, height: 14, borderRadius:'50%', background:'var(--clay)' }}/>
                <div style={{ width: 2, flex: 1, background:'var(--line-strong)', minHeight: 50, marginTop: 4, marginBottom: 4, backgroundImage: 'linear-gradient(var(--ink-soft) 50%, transparent 50%)', backgroundSize: '2px 8px' }}/>
                <div style={{ width: 14, height: 14, background:'var(--lagoon)', borderRadius: 2 }}/>
              </div>
              <div style={{ flex: 1, display:'flex', flexDirection:'column', justifyContent:'space-between', minHeight: 80 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{from === 'CUN' ? 'Cancún International Airport' : from === 'TQO' ? 'Tulum Felipe Carrillo Puerto' : from}</div>
                  <div className="mono" style={{ color:'var(--ink-soft)' }}>PICKUP · {time || '—'}</div>
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{to}</div>
                  <div className="mono" style={{ color:'var(--ink-soft)' }}>ETA · {time ? addHours(time, 3) : '—'}</div>
                </div>
              </div>
            </div>

            <div className="rg-confirm-info" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap: 12, marginTop: 20 }}>
              {[
                { k: 'track', l: lang==='en'?'Flight tracking':'Rastreo vuelo' },
                { k: 'wifi', l: 'WiFi + USB' },
                { k: 'water', l: lang==='en'?'Cold water':'Agua fría' },
                { k: 'child', l: lang==='en'?'Free child seat':'Silla bebé gratis' }
              ].map(f => (
                <div key={f.k} style={{ padding: 12, background:'var(--bone-2)', borderRadius: 8, display:'flex', alignItems:'center', gap: 8, fontSize: 13 }}>
                  <Icon d={icons.check} size={14} stroke={2.5}/>
                  {f.l}
                </div>
              ))}
            </div>

            <button className="btn btn-sun btn-lg" style={{ width:'100%', marginTop: 20 }}
              onClick={() => navigate('detail', { tourId: from === 'TQO' ? 'transfer-tulum' : 'transfer-cun' })}>
              {t.bookNow} — ${total}
            </button>
          </div>

          {/* Side info */}
          <div>
            <div className="card" style={{ padding: 20, marginBottom: 16 }}>
              <div className="mono" style={{ color:'var(--ink-soft)', marginBottom: 10 }}>POPULAR ROUTES</div>
              <div style={{ display:'flex', flexDirection:'column', gap: 8 }}>
                {[
                  { a: 'CUN', b: 'Bacalar', p: 220, t: '4h' },
                  { a: 'TQO', b: 'Bacalar', p: 140, t: '2h' },
                  { a: 'CUN', b: 'Mahahual', p: 260, t: '4h 30' },
                  { a: 'TQO', b: 'Mahahual', p: 160, t: '2h 20' },
                  { a: 'CUN', b: 'Tulum', p: 110, t: '1h 30' }
                ].map((r,i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', padding: '10px 0', borderTop: i > 0 ? '1px solid var(--line)' : 'none', fontSize: 13 }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{r.a} → {r.b}</div>
                      <div className="mono" style={{ color:'var(--ink-soft)', marginTop: 2 }}>{r.t}</div>
                    </div>
                    <div style={{ fontWeight: 600 }}>${r.p}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ padding: 20, background:'var(--sun)', color:'var(--ink)' }}>
              <div className="mono" style={{ marginBottom: 10 }}>● LIVE</div>
              <div style={{ fontWeight: 600 }}>{lang==='en'?'3 drivers are currently near CUN.':'3 choferes cerca de CUN ahora.'}</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>{lang==='en'?'Book now, be on the road in <40 min.':'Reserva y parte en <40 min.'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Map page
const MapPage = ({ focus }) => {
  const { t, lang, navigate } = useT();
  const [sel, setSel] = useState(focus || null);
  const selected = window.MAP_PINS.find(p => p.id === sel);
  const toursAtPin = selected
    ? window.TOURS.filter(t => t.location.toLowerCase().includes(selected.name.toLowerCase()) || (selected.id === 'mahahual' && t.audience.includes('port')) || (selected.id === 'bacalar' && t.category === 'lagoon'))
    : [];

  return (
    <div className="container fade-in" style={{ paddingTop: 32, paddingBottom: 40 }}>
      <div className="mono" style={{ color:'var(--ink-soft)', marginBottom: 8 }}>03 / MAP · 18.68°N 88.38°W</div>
      <h1 className="display" style={{ fontSize: 56, margin: '0 0 24px', lineHeight: 0.95 }}>
        {lang==='en'?'Tap a pin.':'Toca un pin.'} <span style={{color:'var(--clay)'}}>{lang==='en'?'Find your tour.':'Encuentra tu tour.'}</span>
      </h1>

      <div className="rg" style={{ display:'grid', gridTemplateColumns: '1.4fr 1fr', gap: 28, alignItems:'flex-start' }}>
        <div>
          <MiniMap onPinClick={(p)=>setSel(p.id)} selected={sel}/>
          <div style={{ display:'flex', gap: 8, flexWrap:'wrap', marginTop: 16 }}>
            {window.MAP_PINS.map(p => (
              <button key={p.id} className={`chip ${sel === p.id ? 'active' : ''}`} onClick={()=>setSel(p.id)} style={{ border:'none', cursor:'pointer' }}>
                <Icon d={icons.pin} size={10}/> {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 24, minHeight: 400 }}>
          {!selected && (
            <div style={{ color:'var(--ink-soft)', textAlign:'center', padding: 60 }}>
              {lang==='en'?'Select a destination on the map →':'Selecciona un destino en el mapa →'}
            </div>
          )}
          {selected && (
            <div className="fade-in">
              <div className="mono" style={{ color:'var(--ink-soft)' }}>SELECTED</div>
              <h2 className="display" style={{ fontSize: 36, margin: '4px 0 10px' }}>{selected.name}</h2>
              <div className="mono" style={{ color:'var(--clay)', marginBottom: 20 }}>{selected.label[lang]}</div>
              <div style={{ display:'flex', flexDirection:'column', gap: 12 }}>
                {toursAtPin.slice(0,4).map(tour => (
                  <div key={tour.id} onClick={()=>navigate('detail', { tourId: tour.id })}
                    style={{ display:'flex', gap: 12, padding: 12, borderRadius: 10, border:'1px solid var(--line)', cursor:'pointer' }}>
                    <window.Photo src={window.tourPhoto(tour)} style={{ width: 64, height: 64, borderRadius: 8, flexShrink: 0 }} overlay={false}/>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{tour.title[lang]}</div>
                      <div className="mono" style={{ color:'var(--ink-soft)', marginTop: 4 }}>${tour.priceAdult} · {tour.duration}h</div>
                    </div>
                    <Icon d={icons.arrow} size={14}/>
                  </div>
                ))}
                {toursAtPin.length === 0 && (
                  <div style={{ color:'var(--ink-soft)', fontSize: 13 }}>{lang==='en'?'No tours here yet — ask us on WhatsApp.':'Sin tours aquí — escríbenos por WhatsApp.'}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

window.Transfers = Transfers;
window.MapPage = MapPage;
