// Stripe success-redirect landing. The real Booking row is created
// asynchronously by the backend's Stripe webhook (idempotent), so we just
// confirm receipt and tell the user to check their inbox. session_id from
// Stripe is shown for support reference.
const Thanks = ({ params }) => {
  const { t, lang, navigate, clearCart } = useT();
  const sessionId = params?.session_id || params?.sessionId || '';

  React.useEffect(() => {
    // Cart drawer state is local; clear it now that payment succeeded.
    clearCart();
  }, []);

  return (
    <div className="container fade-in" style={{ paddingTop: 40, paddingBottom: 80, maxWidth: 720 }}>
      <div style={{ background:'var(--lagoon)', color:'var(--ink)', padding:'40px 32px', borderRadius:'var(--radius-lg)', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-60, right:-60, width:220, height:220, borderRadius:'50%', background:'var(--sun)', opacity:0.5 }}/>
        <div style={{ position:'relative' }}>
          <div style={{ width:56, height:56, borderRadius:'50%', background:'var(--ink)', color:'var(--sun)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:18 }}>
            <Icon d={icons.check} size={28} stroke={2.5}/>
          </div>
          <h1 className="display" style={{ fontSize:48, margin:0, lineHeight:0.95 }}>
            {lang==='en' ? 'Payment received' : 'Pago recibido'} <span style={{ color:'var(--ink-2)' }}>¡salud!</span>
          </h1>
          <p style={{ fontSize:17, marginTop:12, color:'var(--ink-2)', lineHeight:1.5 }}>
            {lang==='en'
              ? 'Your booking is being confirmed right now. A confirmation email with your voucher and pickup details will land in your inbox within a minute.'
              : 'Tu reserva se está confirmando ahora mismo. Recibirás un correo con tu voucher y los detalles de recogida en menos de un minuto.'}
          </p>
        </div>
      </div>

      {sessionId && (
        <div className="card" style={{ marginTop:20, padding:18 }}>
          <div className="mono" style={{ color:'var(--ink-soft)' }}>{lang==='en' ? 'Stripe session' : 'Sesión Stripe'}</div>
          <div className="mono" style={{ marginTop:4, fontSize:12, wordBreak:'break-all' }}>{sessionId}</div>
          <div style={{ color:'var(--ink-soft)', fontSize:13, marginTop:8 }}>
            {lang==='en'
              ? 'Save this in case you need to contact support.'
              : 'Guárdalo por si necesitas contactarnos.'}
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop:20, padding:24 }}>
        <h3 className="display" style={{ fontSize:22, margin:'0 0 12px' }}>
          {lang==='en' ? 'What happens next' : 'Qué sigue'}
        </h3>
        <ol style={{ paddingLeft:20, margin:0, fontSize:14, lineHeight:1.7 }}>
          <li>{lang==='en' ? 'Confirmation email + PDF voucher arrive shortly.' : 'Correo de confirmación + voucher PDF llegan pronto.'}</li>
          <li>{lang==='en' ? 'We message you 24 hrs before with the final pickup point and time.' : 'Te escribimos 24 hrs antes con el punto de recogida y hora finales.'}</li>
          <li>{lang==='en' ? 'Free cancellation up to 48 hrs before — reply to the email or message us on WhatsApp.' : 'Cancelación gratuita hasta 48 hrs antes — responde el correo o escríbenos por WhatsApp.'}</li>
        </ol>
      </div>

      <div style={{ display:'flex', gap:10, marginTop:24, justifyContent:'center' }}>
        <button className="btn btn-outline" onClick={()=>navigate('home')}>
          {lang==='en' ? 'Back to home' : 'Volver al inicio'}
        </button>
        <button className="btn btn-primary" onClick={()=>navigate('catalog')}>
          {lang==='en' ? 'Browse more tours' : 'Ver más tours'}
        </button>
      </div>
    </div>
  );
};

window.Thanks = Thanks;
