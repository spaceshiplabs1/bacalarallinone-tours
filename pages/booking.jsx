// Booking flow — details → payment → confirmation
// Accepts either a single-tour booking ({ tourId, ... }) or a cart array ({ cart: [...] }).
const Booking = ({ booking }) => {
  const { t, lang, navigate, clearCart } = useT();
  const isCart = Array.isArray(booking?.cart) && booking.cart.length > 0;
  const items = isCart ? booking.cart : (booking?.tourId ? [booking] : []);
  const primaryTour = items[0] ? window.TOURS.find(x => x.id === items[0].tourId) : null;
  const anyPort = items.some(it => {
    const tr = window.TOURS.find(x => x.id === it.tourId);
    return tr && tr.audience.includes('port');
  });
  const grandTotal = isCart
    ? items.reduce((s, it) => s + (Number(it.subtotal) || 0), 0)
    : (Number(booking?.total) || 0);

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', country: 'Mexico',
    cruiseShip: ''
  });
  const [submitState, setSubmitState] = useState({ submitting: false, error: null });
  const [ref] = useState('BAC-' + Math.random().toString(36).slice(2,8).toUpperCase());

  React.useEffect(() => {
    if (step === 3 && isCart) clearCart();
  }, [step, isCart]);

  if (!items.length) {
    return <div className="container" style={{ padding: 40 }}>No booking in progress. <button onClick={()=>navigate('catalog')} className="btn btn-primary">{t.enterCatalog}</button></div>;
  }
  // Back-compat: code below expects `tour` (the primary tour for single-item flow & port check).
  const tour = primaryTour;

  const step1Valid = form.firstName && form.lastName && form.email && form.phone;

  // Real submit: bridge UI cart lines → API cart → Stripe Checkout.
  // Booking.jsx is reached either with `cart: [...]` (multi-item) or with
  // a single-tour booking object (`{tourId, date, time, adults, kids, total}`).
  // The cart helper expects an array shape in both cases.
  const submitToStripe = async () => {
    if (submitState.submitting) return;
    setSubmitState({ submitting: true, error: null });
    try {
      const cartLines = items.map((it) => ({
        tourId: it.tourId,
        date: it.date,
        time: it.time,
        adults: it.adults || 0,
        kids: it.kids || 0,
        infants: it.infants || 0,
        pickup: it.pickup,
        subtotal: Number(it.subtotal) || (Number(booking?.total) || 0),
      }));
      const customer = {
        email: form.email,
        name: `${form.firstName} ${form.lastName}`.trim(),
        phone: form.phone,
        locale: lang,
      };
      const origin = window.location.origin + window.location.pathname;
      await window.tagcCart.submitAndRedirect({
        customer,
        items: cartLines,
        successUrl: `${origin}#/thanks?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl:  `${origin}#/booking`,
      });
      // submitAndRedirect navigates away on success; nothing below runs.
    } catch (err) {
      console.error('[booking] checkout failed:', err);
      setSubmitState({
        submitting: false,
        error: err?.body?.error || err?.message || 'checkout_failed',
      });
    }
  };

  return (
    <div className="container fade-in" style={{ paddingTop: 28, paddingBottom: 60, maxWidth: 980 }}>
      {/* Progress */}
      <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 32 }}>
        {[1,2,3].map(s => (
          <React.Fragment key={s}>
            <div style={{
              display:'flex', alignItems:'center', gap: 8,
              opacity: step >= s ? 1 : 0.4
            }}>
              <div style={{
                width: 28, height: 28, borderRadius:'50%',
                background: step > s ? 'var(--lagoon)' : (step === s ? 'var(--ink)' : 'var(--bone-2)'),
                color: step >= s ? 'var(--bone)' : 'var(--ink-soft)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontWeight: 600, fontSize: 13,
                border: step === s ? 'none' : '1px solid var(--line)'
              }}>{step > s ? <Icon d={icons.check} size={14} stroke={2.5}/> : s}</div>
              <span className="mono">
                {s===1?t.yourDetails:s===2?t.payment:t.confirmed}
              </span>
            </div>
            {s < 3 && <div style={{ flex: 1, height: 1, background: step > s ? 'var(--lagoon)' : 'var(--line)' }}/>}
          </React.Fragment>
        ))}
      </div>

      <div className="rg-sidebar" style={{ display:'grid', gridTemplateColumns: step === 3 ? '1fr' : '1fr 340px', gap: 32, alignItems:'flex-start' }}>
        <div>
          {step === 1 && (
            <div className="card fade-in" style={{ padding: 28 }}>
              <h2 className="display" style={{ fontSize: 32, margin: '0 0 20px' }}>{t.yourDetails}</h2>
              <div className="rg-form" style={{ display:'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <label className="field"><span className="mono">{t.firstName}</span>
                  <input className="input" value={form.firstName} onChange={e=>setForm({...form, firstName: e.target.value})}/>
                </label>
                <label className="field"><span className="mono">{t.lastName}</span>
                  <input className="input" value={form.lastName} onChange={e=>setForm({...form, lastName: e.target.value})}/>
                </label>
                <label className="field"><span className="mono">{t.email}</span>
                  <input className="input" type="email" value={form.email} onChange={e=>setForm({...form, email: e.target.value})}/>
                </label>
                <label className="field"><span className="mono">{t.phone}</span>
                  <input className="input" value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} placeholder="+1 555 555 0199"/>
                </label>
                <label className="field" style={{ gridColumn:'span 2' }}><span className="mono">{t.country}</span>
                  <select className="select" value={form.country} onChange={e=>setForm({...form, country: e.target.value})}>
                    {['Mexico','United States','Canada','Spain','Germany','United Kingdom','France','Italy','Argentina','Brazil','Chile','Colombia','Other'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </label>
                {anyPort && (
                  <label className="field" style={{ gridColumn:'span 2' }}>
                    <span className="mono">{t.cruiseShip} <span style={{textTransform:'none', opacity:0.6}}>{t.cruiseShipOpt}</span></span>
                    <select className="select" value={form.cruiseShip} onChange={e=>setForm({...form, cruiseShip: e.target.value})}>
                      <option value="">—</option>
                      {window.CRUISE_SHIPS.map(s => <option key={s.name}>{s.name}</option>)}
                    </select>
                  </label>
                )}
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop: 24 }}>
                <button className="btn btn-ghost" onClick={()=>navigate('detail', { tourId: tour.id })}><Icon d={icons.chevronLeft} size={14}/> {t.back}</button>
                <button className="btn btn-primary" disabled={!step1Valid} style={{ opacity: step1Valid ? 1 : 0.5 }} onClick={()=>setStep(2)}>{t.continue} <Icon d={icons.arrow} size={14}/></button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="card fade-in" style={{ padding: 28 }}>
              <h2 className="display" style={{ fontSize: 32, margin: '0 0 8px' }}>{t.payment}</h2>
              <p style={{ color:'var(--ink-soft)', marginTop: 0, marginBottom: 22 }}>
                {lang==='en'
                  ? 'Card details are entered on Stripe’s secure page after you continue. Your booking is held while you pay; you can cancel free up to 48 hrs before.'
                  : 'Los datos de tu tarjeta se ingresan en la página segura de Stripe después de continuar. Tu reserva queda apartada mientras pagas.'}
              </p>

              {/* Review block */}
              <div style={{ padding: 18, border: '1px solid var(--line)', borderRadius: 12, marginBottom: 18 }}>
                <div className="mono" style={{ color:'var(--ink-soft)', marginBottom: 10 }}>
                  {lang==='en' ? 'Booking under' : 'Reserva a nombre de'}
                </div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{form.firstName} {form.lastName}</div>
                <div style={{ color:'var(--ink-soft)', fontSize: 13, marginTop: 2 }}>{form.email} · {form.phone}</div>
              </div>

              <div style={{ display:'flex', gap: 10, alignItems:'center', padding: 12, background: 'var(--bone-2)', borderRadius: 8, fontSize: 12, color:'var(--ink-soft)' }}>
                <Icon d={icons.shield} size={16}/>
                {lang==='en'
                  ? 'Powered by Stripe. We never see or store your card.'
                  : 'Procesado por Stripe. Nunca vemos ni guardamos tu tarjeta.'}
              </div>

              {submitState.error && (
                <div style={{ marginTop: 14, padding: 12, background: 'rgba(220, 60, 60, 0.08)', border: '1px solid rgba(220, 60, 60, 0.3)', borderRadius: 8, fontSize: 13, color: '#a02020' }}>
                  {lang==='en' ? 'Could not start checkout: ' : 'No se pudo iniciar el pago: '} <span className="mono">{submitState.error}</span>
                </div>
              )}

              <div style={{ display:'flex', justifyContent:'space-between', marginTop: 24 }}>
                <button className="btn btn-ghost" disabled={submitState.submitting} onClick={()=>setStep(1)}>
                  <Icon d={icons.chevronLeft} size={14}/> {t.back}
                </button>
                <button
                  className="btn btn-sun btn-lg"
                  disabled={submitState.submitting}
                  style={{ opacity: submitState.submitting ? 0.6 : 1 }}
                  onClick={submitToStripe}
                >
                  {submitState.submitting
                    ? (lang==='en' ? 'Redirecting…' : 'Redirigiendo…')
                    : `${t.payAndConfirm} · $${grandTotal.toLocaleString()}`}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <Confirmation tour={tour} items={items} booking={booking} form={form} ref_={ref} grandTotal={grandTotal} isCart={isCart}/>
          )}
        </div>

        {step < 3 && (
          <BookingSummary items={items} grandTotal={grandTotal} isCart={isCart}/>
        )}
      </div>
    </div>
  );
};

const BookingSummary = ({ items, grandTotal, isCart }) => {
  const { t, lang } = useT();
  return (
    <div className="rg-sticky-col" style={{ position:'sticky', top: 90 }}>
      <div className="card" style={{ padding: 20 }}>
        <div className="mono" style={{ color:'var(--ink-soft)', marginBottom: 12 }}>
          {t.bookingSummary} · {items.length} {items.length === 1 ? t.item : t.items}
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap: 14, maxHeight: 420, overflowY: 'auto' }}>
          {items.map((it, idx) => {
            const tr = window.TOURS.find(x => x.id === it.tourId);
            if (!tr) return null;
            return (
              <div key={it.id || idx} style={{ display:'flex', gap: 10 }}>
                <div style={{ width: 60, height: 60, borderRadius: 8, overflow:'hidden', flexShrink: 0, background:'var(--bone-2)' }}>
                  <img src={window.tourPhoto(tr)} alt="" loading="lazy"
                    style={{ width:'100%', height:'100%', objectFit:'cover' }}
                    onError={(e)=>{ e.target.style.display='none'; }}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.2 }}>{tr.title[lang]}</div>
                  <div className="mono" style={{ color:'var(--ink-soft)', fontSize: 10, marginTop: 3 }}>
                    {it.date} · {it.time}
                  </div>
                  <div className="mono" style={{ color:'var(--ink-soft)', fontSize: 10, marginTop: 2 }}>
                    {tr.flat
                      ? '1 van'
                      : `${it.adults || 0} ${t.adults.toLowerCase()}${it.kids ? ` · ${it.kids} ${t.kids.toLowerCase()}` : ''}${it.infants ? ` · ${it.infants} ${t.infants.toLowerCase()}` : ''}`
                    }
                  </div>
                  {it.pickup && it.pickup.label && (
                    <div className="mono" style={{ color:'var(--ink-soft)', fontSize: 10, marginTop: 2 }}>
                      <Icon d={icons.pin} size={9}/> {it.pickup.label[lang]}
                    </div>
                  )}
                  <div style={{ marginTop: 4, fontSize: 13, fontWeight: 600 }}>${Number(it.subtotal).toLocaleString()}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ height: 1, background:'var(--line)', margin:'16px 0' }}/>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
          <span className="mono">{t.total}</span>
          <span className="display" style={{ fontSize: 26 }}>${grandTotal.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

const SumRow = ({ label, value }) => (
  <div style={{ display:'flex', justifyContent:'space-between' }}>
    <span style={{ color:'var(--ink-soft)' }}>{label}</span>
    <span style={{ fontWeight: 500 }}>{value}</span>
  </div>
);

const Confirmation = ({ tour, items, booking, form, ref_, grandTotal, isCart }) => {
  const { t, lang, navigate } = useT();
  const firstItem = items[0];
  const firstTour = tour || window.TOURS.find(x => x.id === firstItem?.tourId);
  const firstDate = firstItem?.date || booking?.date;
  const firstTime = firstItem?.time || booking?.time;
  const totalPax = items.reduce((s, it) => {
    const tr = window.TOURS.find(x => x.id === it.tourId);
    if (!tr) return s;
    return s + (tr.flat ? 0 : (it.adults || 0) + (it.kids || 0));
  }, 0);
  return (
    <div className="fade-in">
      {/* big celebratory banner */}
      <div style={{ background:'var(--lagoon)', color:'var(--ink)', padding: '40px 32px', borderRadius: 'var(--radius-lg)', marginBottom: 20, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius:'50%', background: 'var(--sun)', opacity: 0.5 }}/>
        <div style={{ position:'relative' }}>
          <div style={{ width: 56, height: 56, borderRadius:'50%', background:'var(--ink)', color:'var(--sun)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom: 18 }}>
            <Icon d={icons.check} size={28} stroke={2.5}/>
          </div>
          <h1 className="display" style={{ fontSize: 56, margin: 0, lineHeight: 0.95 }}>
            {t.confirmed} <span style={{ color: 'var(--ink-2)', fontWeight: 600 }}>¡salud!</span>
          </h1>
          <p style={{ fontSize: 18, marginTop: 10, color: 'var(--ink-2)' }}>
            {t.confirmedSub}{items.length > 1 ? ` · ${items.length} ${t.items}` : ''}
          </p>
          <div style={{ display:'flex', gap: 24, marginTop: 20, flexWrap:'wrap' }}>
            <div>
              <div className="mono" style={{ opacity: 0.7 }}>{t.bookingRef}</div>
              <div className="display" style={{ fontSize: 26 }}>{ref_}</div>
            </div>
            <div>
              <div className="mono" style={{ opacity: 0.7 }}>{t.email}</div>
              <div style={{ fontWeight: 600 }}>{form.email}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Email preview */}
      <div className="card" style={{ padding: 0, overflow:'hidden' }}>
        <div style={{ padding: '12px 20px', background:'var(--bone-2)', borderBottom:'1px solid var(--line)', display:'flex', alignItems:'center', gap: 10 }}>
          <div style={{ display:'flex', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius:'50%', background: '#ff5f57' }}/>
            <div style={{ width: 10, height: 10, borderRadius:'50%', background: '#febc2e' }}/>
            <div style={{ width: 10, height: 10, borderRadius:'50%', background: '#28c840' }}/>
          </div>
          <span className="mono" style={{ color:'var(--ink-soft)' }}>INBOX · 1 new</span>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ fontSize: 12, color:'var(--ink-soft)', marginBottom: 14 }}>
            <strong>From:</strong> hola@bacalarallinone.tours<br/>
            <strong>To:</strong> {form.email}<br/>
            <strong>Subject:</strong> {items.length > 1
              ? (lang==='en' ? `✅ ${items.length} tours confirmed — starting ${firstDate}` : `✅ ${items.length} tours confirmados — desde ${firstDate}`)
              : (lang==='en' ? `✅ ${firstTour.title.en} — confirmed for ${firstDate}` : `✅ ${firstTour.title.es} — confirmado ${firstDate}`)
            }
          </div>
          <div style={{ borderTop:'1px solid var(--line)', paddingTop: 18 }}>
            <h3 className="display" style={{ fontSize: 22, margin: 0 }}>{lang==='en'?`Hola ${form.firstName}!`:`¡Hola ${form.firstName}!`}</h3>
            <p style={{ fontSize: 14, color:'var(--ink-soft)', marginTop: 10, lineHeight: 1.6 }}>
              {items.length > 1
                ? (lang==='en'
                    ? `You're all set for ${items.length} tours. Below is everything you need for each. Save this email — and reach us on WhatsApp any time.`
                    : `Todo listo para ${items.length} tours. Abajo está todo lo necesario para cada uno. Guárdalo — escríbenos por WhatsApp cuando quieras.`)
                : (lang==='en'
                    ? `You're all set for ${firstTour.title.en} on ${firstDate} at ${firstTime}. Below is everything you need. Save this email — and reach us on WhatsApp any time.`
                    : `Todo listo para ${firstTour.title.es} el ${firstDate} a las ${firstTime}. Abajo está todo lo necesario. Guarda este correo — escríbenos por WhatsApp cuando quieras.`)
              }
            </p>
            <div className="rg-confirm-info" style={{ display:'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 20, padding: 16, background:'var(--bone-2)', borderRadius: 10 }}>
              <Field label={t.bookingRef} value={ref_}/>
              <Field label={items.length > 1 ? (lang==='en'?'Tours':'Tours') : t.date} value={items.length > 1 ? items.length : firstDate}/>
              <Field label={lang==='en'?'Starts':'Desde'} value={firstDate}/>
              <Field label={lang==='en'?'Party':'Grupo'} value={totalPax > 0 ? `${totalPax} ${lang==='en'?'pax':'pers'}` : '—'}/>
            </div>
            {items.length > 1 && (
              <div style={{ marginTop: 18, display:'flex', flexDirection:'column', gap: 10 }}>
                {items.map((it, idx) => {
                  const tr = window.TOURS.find(x => x.id === it.tourId);
                  if (!tr) return null;
                  return (
                    <div key={it.id || idx} style={{ display:'flex', gap: 12, padding: 12, border:'1px solid var(--line)', borderRadius: 10, alignItems:'center' }}>
                      <div style={{ width: 52, height: 52, borderRadius: 8, overflow:'hidden', flexShrink:0, background:'var(--bone-2)' }}>
                        <img src={window.tourPhoto(tr)} alt=""
                          style={{ width:'100%', height:'100%', objectFit:'cover' }}
                          onError={(e)=>{ e.target.style.display='none'; }}/>
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{tr.title[lang]}</div>
                        <div className="mono" style={{ color:'var(--ink-soft)', marginTop: 2 }}>{it.date} · {it.time}</div>
                      </div>
                      <div className="display" style={{ fontSize: 18 }}>${Number(it.subtotal).toLocaleString()}</div>
                    </div>
                  );
                })}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', padding: '8px 4px' }}>
                  <span className="mono" style={{ color:'var(--ink-soft)' }}>{t.total}</span>
                  <span className="display" style={{ fontSize: 24 }}>${grandTotal.toLocaleString()}</span>
                </div>
              </div>
            )}
            {items.length === 1 && firstTour.meet && (
              <div style={{ marginTop: 16, padding: 16, background:'var(--sun)', color:'var(--ink)', borderRadius: 10 }}>
                <div className="mono" style={{ marginBottom: 4 }}>📍 {t.meetingPoint}</div>
                <div style={{ fontWeight: 600 }}>{firstTour.meet[lang]}</div>
              </div>
            )}
            <div style={{ marginTop: 18 }}>
              <div className="mono" style={{ color:'var(--ink-soft)', marginBottom: 10 }}>{t.whatsNext}</div>
              <ol style={{ paddingLeft: 20, margin: 0, fontSize: 14, lineHeight: 1.7 }}>
                <li>{lang==='en'?'Confirmation PDF + WhatsApp link sent to you.':'PDF de confirmación + link WhatsApp enviado.'}</li>
                <li>{lang==='en'?'We contact you 24hrs before with final pickup details.':'Te contactamos 24hrs antes con detalles.'}</li>
                <li>{lang==='en'?`Free cancellation up to 24hrs before — your card is held, not charged until ${firstDate}.`:`Cancelación gratis 24hrs antes.`}</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display:'flex', gap: 10, marginTop: 24, justifyContent:'center' }}>
        <button className="btn btn-outline" onClick={()=>navigate('home')}>{lang==='en'?'Back to home':'Volver al inicio'}</button>
        <button className="btn btn-primary" onClick={()=>navigate('catalog')}>{lang==='en'?'Browse more tours':'Ver más tours'}</button>
      </div>
    </div>
  );
};

const Field = ({ label, value }) => (
  <div>
    <div className="mono" style={{ color:'var(--ink-soft)' }}>{label}</div>
    <div style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>{value}</div>
  </div>
);

window.Booking = Booking;
