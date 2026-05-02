// Shared UI components — header, footer, tour cards, icons, map
const { useState, useEffect, useMemo, useRef, useCallback } = React;

// ───────────────────────────────────────────── icons
const Icon = ({ d, size = 18, stroke = 1.7 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    {typeof d === 'string' ? <path d={d}/> : d}
  </svg>
);

const icons = {
  anchor: <><circle cx="12" cy="5" r="2"/><path d="M12 7v13"/><path d="M5 16a7 7 0 0 0 14 0"/><path d="M8 13H4"/><path d="M20 13h-4"/></>,
  // ship/compass/bus paths sourced verbatim from lucide.dev (ISC) —
  // higher-fidelity than my hand-drawn versions and instantly readable
  // at small badge sizes.
  ship: <><path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/><path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/><path d="M12 10v4"/><path d="M12 2v3"/></>,
  compass: <><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></>,
  bus: <><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></>,
  leaf: <><path d="M11 20A7 7 0 0 1 4 13V5h8a7 7 0 0 1 7 7 7 7 0 0 1-7 7h-1z"/><path d="M4 5s6 2 10 7"/></>,
  pyramid: <><path d="M12 3 2 21h20L12 3z"/><path d="M6 14h12"/><path d="M9 9h6"/></>,
  waves: <><path d="M2 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><path d="M2 17c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><path d="M2 7c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/></>,
  sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/></>,
  pin: <><path d="M12 22s-7-8-7-13a7 7 0 0 1 14 0c0 5-7 13-7 13z"/><circle cx="12" cy="9" r="2.5"/></>,
  clock: <><circle cx="12" cy="12" r="10"/><path d="M12 7v5l3 2"/></>,
  users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
  check: "M5 13l4 4L19 7",
  chevron: "M9 6l6 6-6 6",
  chevronDown: "M6 9l6 6 6-6",
  chevronLeft: "M15 18l-6-6 6-6",
  star: <><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/></>,
  heart: <><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></>,
  globe: <><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z"/></>,
  whatsapp: <><path d="M17.5 14c-.3-.2-1.8-.9-2.1-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7 0c-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1s0-.4.1-.6l.4-.5c.1-.2.2-.3.3-.5s0-.4 0-.5-.7-1.7-1-2.3-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4s-1.1 1-1.1 2.5 1.1 2.9 1.2 3.1c.2.2 2.2 3.3 5.3 4.6l1.8.6c.7.2 1.4.2 2 .1.6-.1 1.8-.7 2-1.4s.3-1.3.2-1.4c-.1-.1-.3-.2-.6-.3z"/><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l4.9-1.3A10 10 0 1 0 12 2z"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></>,
  arrow: "M5 12h14M13 5l7 7-7 7",
  x: "M6 6l12 12M6 18L18 6",
  menu: "M3 6h18M3 12h18M3 18h18",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></>,
  spark: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
  credit: <><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/></>,
  send: <><path d="m22 2-7 20-4-9-9-4 20-7z"/><path d="M22 2 11 13"/></>,
  bag: <><path d="M6 7h12l-1 13H7L6 7z"/><path d="M9 7a3 3 0 0 1 6 0"/></>,
  trash: <><path d="M4 7h16M10 11v6M14 11v6M9 7V4h6v3M6 7l1 13h10l1-13"/></>,
  van: <><rect x="3" y="9" width="18" height="8" rx="1.5"/><path d="M9 9v4M15 9v4"/><path d="M3 13h18"/><circle cx="7" cy="17.5" r="1.8" fill="currentColor" stroke="none"/><circle cx="17" cy="17.5" r="1.8" fill="currentColor" stroke="none"/></>
};

window.Icon = Icon;
window.icons = icons;

// ───────────────────────────────────────────── context
window.AppCtx = React.createContext({ lang: 'en', t: {}, setLang: () => {}, theme: 'tropical', setTheme: () => {}, navigate: () => {} });
window.useT = () => React.useContext(window.AppCtx);

// ───────────────────────────────────────────── logo
// Brand wordmark image — script "bacalarallinone.tours" with wave
// underline. Background chroma-keyed to transparent so it sits on
// any color cleanly.
const Logo = ({ size = 1 }) => (
  <img
    src="./images/logo-long.webp"
    alt="bacalarallinone.tours"
    style={{
      height: 44 * size,
      width: 'auto',
      display: 'block',
      flexShrink: 0,
    }}
  />
);
window.Logo = Logo;

// ───────────────────────────────────────────── wave decorations
// Echo the wave underline beneath "bacalar" in the brand logo across
// the rest of the site. Three reusable SVG components — drop them in
// dividers, footers, hero corners, or as small accents under headings.
//
// All three are pure SVG (no images, no extra requests), color-aware
// via CSS variables, and scale via inline style props.

// Single brush-style wave, like the squiggle below "bacalar" in the
// wordmark. Use under a heading, after a number, in a callout.
//   <WaveMark/>                 // default sun, 88×14
//   <WaveMark color="lagoon" width={120}/>
const WaveMark = ({ color = 'sun', width = 88, height = 14, strokeWidth = 2.6 }) => {
  const stroke = color.startsWith('var(') || color.startsWith('#') ? color : `var(--${color})`;
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 88 14"
      preserveAspectRatio="none"
      aria-hidden
      style={{ display: 'block', overflow: 'visible' }}
    >
      <path
        d="M2 8 Q12 -1 22 8 T42 8 T62 8 T86 7"
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
};
window.WaveMark = WaveMark;

// Section divider — three layered horizontal sine waves in the lagoon
// rampada, full-bleed across its container. Replaces flat <hr>-style
// lines between sections so the page feels less editorial-rigid.
//   <WaveDivider/>                  // full
//   <WaveDivider variant="subtle"/> // single hairline
const WaveDivider = ({ variant = 'full', height = 56 }) => {
  if (variant === 'subtle') {
    return (
      <svg
        width="100%"
        height={Math.round(height * 0.5)}
        viewBox="0 0 1200 28"
        preserveAspectRatio="none"
        aria-hidden
        style={{ display: 'block' }}
      >
        <path
          d="M0 14 Q200 0 400 14 T800 14 T1200 14"
          fill="none"
          stroke="var(--lagoon-pale)"
          strokeWidth="1.5"
          opacity="0.85"
        />
      </svg>
    );
  }
  return (
    <svg
      width="100%"
      height={height}
      viewBox="0 0 1200 56"
      preserveAspectRatio="none"
      aria-hidden
      style={{ display: 'block' }}
    >
      <path
        d="M0 22 Q200 6 400 22 T800 22 T1200 22"
        fill="none"
        stroke="var(--lagoon-darkest)"
        strokeWidth="1.6"
        opacity="0.45"
      />
      <path
        d="M0 30 Q200 14 400 30 T800 30 T1200 30"
        fill="none"
        stroke="var(--lagoon-deep)"
        strokeWidth="1.6"
        opacity="0.65"
      />
      <path
        d="M0 38 Q200 22 400 38 T800 38 T1200 38"
        fill="none"
        stroke="var(--lagoon)"
        strokeWidth="1.6"
        opacity="0.85"
      />
    </svg>
  );
};
window.WaveDivider = WaveDivider;

// Decorative wave-corner block — abstract overlapping waves filling
// the corner of a section. Use absolutely positioned inside a
// position:relative section. Variant flips orientation.
//   <WaveCorner placement="top-right"/>
//   <WaveCorner placement="bottom-left" tone="pale"/>
const WaveCorner = ({ placement = 'top-right', size = 220, tone = 'lagoon' }) => {
  const flipX = placement.endsWith('left');
  const flipY = placement.startsWith('bottom');
  // Three fills layered from darkest to lightest, like sun on rippling water.
  const fills =
    tone === 'pale'
      ? ['var(--lagoon)', 'var(--lagoon-mid)', 'var(--lagoon-pale)']
      : ['var(--lagoon-darkest)', 'var(--lagoon-deep)', 'var(--lagoon)'];
  const styleByPlacement = {
    'top-right':    { top: 0, right: 0 },
    'top-left':     { top: 0, left: 0 },
    'bottom-right': { bottom: 0, right: 0 },
    'bottom-left':  { bottom: 0, left: 0 },
  }[placement];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 220 220"
      aria-hidden
      style={{
        position: 'absolute',
        ...styleByPlacement,
        transform: `${flipX ? 'scaleX(-1) ' : ''}${flipY ? 'scaleY(-1)' : ''}`.trim(),
        transformOrigin: 'center',
        pointerEvents: 'none',
        opacity: 0.22,
      }}
    >
      <path
        d="M220 0 C 180 60, 120 60, 80 120 C 40 180, 0 180, 0 220 L 220 220 Z"
        fill={fills[0]}
        opacity="0.55"
      />
      <path
        d="M220 30 C 180 90, 130 90, 95 145 C 60 200, 30 200, 30 220 L 220 220 Z"
        fill={fills[1]}
        opacity="0.6"
      />
      <path
        d="M220 60 C 190 110, 150 120, 120 165 C 90 210, 70 210, 70 220 L 220 220 Z"
        fill={fills[2]}
        opacity="0.7"
      />
    </svg>
  );
};
window.WaveCorner = WaveCorner;

// ───────────────────────────────────────────── header
const Header = ({ current }) => {
  const { t, lang, setLang, navigate, cartCount, openCart } = useT();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const go = (key) => { setOpen(false); navigate(key); };

  const link = (key, label) => (
    <a onClick={(e) => { e.preventDefault(); navigate(key); }}
       href="#"
       style={{
         color: current === key ? 'var(--ink)' : 'var(--ink-soft)',
         fontWeight: current === key ? 600 : 500,
         fontSize: 14, textDecoration: 'none', padding: '8px 2px',
         borderBottom: current === key ? '2px solid var(--ink)' : '2px solid transparent',
         cursor: 'pointer'
       }}>{label}</a>
  );
  return (
    <header style={{
      position:'sticky', top: 0, zIndex: 50,
      background: 'color-mix(in oklab, var(--bone) 88%, transparent)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--line)'
    }}>
      <div className="container" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', height: 68, gap: 20 }}>
        <a href="#" onClick={(e) => { e.preventDefault(); navigate('home'); }} style={{ textDecoration:'none', color:'inherit' }}>
          <Logo />
        </a>
        <nav className="header-nav-desktop" style={{ display:'flex', gap: 28, alignItems:'center' }}>
          {link('catalog', t.navTours)}
          {link('map', t.navMap)}
          {link('port', t.navPort)}
          {link('transfers', t.navTransfers)}
        </nav>
        <div className="header-actions-desktop" style={{ display:'flex', gap: 10, alignItems:'center' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setLang(lang === 'en' ? 'es' : 'en')} title={t.language}>
            <Icon d={icons.globe} size={16}/>
            <span className="lang-text" style={{ fontFamily:'JetBrains Mono, monospace', fontSize:11, letterSpacing:'0.1em' }}>{lang.toUpperCase()}</span>
          </button>
          <button
            onClick={openCart}
            title={t.cart}
            aria-label={t.cart}
            style={{
              position:'relative', width: 40, height: 40, borderRadius: 10,
              border: '1px solid var(--line)', background: 'transparent', color: 'var(--ink)',
              display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'
            }}>
            <Icon d={icons.bag} size={18}/>
            {cartCount > 0 && (
              <span style={{
                position:'absolute', top: -6, right: -6, minWidth: 20, height: 20, padding: '0 5px',
                borderRadius: 999, background: 'var(--clay)', color: 'var(--bone)',
                fontSize: 11, fontWeight: 700, display:'flex', alignItems:'center', justifyContent:'center',
                border: '2px solid var(--bone)'
              }}>{cartCount}</span>
            )}
          </button>
          <button className="btn btn-primary btn-sm desktop-only" onClick={() => navigate('catalog')}>
            {t.bookNow}
          </button>
          <button
            onClick={() => setOpen(o => !o)}
            title="Menu" aria-label="Menu"
            className="mobile-only"
            style={{
              width: 40, height: 40, borderRadius: 10,
              border: '1px solid var(--line)', background: 'transparent', color: 'var(--ink)',
              alignItems:'center', justifyContent:'center', cursor:'pointer'
            }}>
            <Icon d={open ? icons.x : icons.menu} size={18}/>
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position:'fixed', inset: '68px 0 0', zIndex: 49,
            background: 'var(--bone)', borderTop: '1px solid var(--line)',
            animation: 'slideUp 0.2s ease both'
          }}>
          <div className="container" style={{ paddingTop: 24, paddingBottom: 40, display:'flex', flexDirection:'column', gap: 4 }} onClick={(e)=>e.stopPropagation()}>
            {[
              ['catalog',   t.navTours],
              ['map',       t.navMap],
              ['port',      t.navPort],
              ['transfers', t.navTransfers]
            ].map(([k, label]) => (
              <button key={k}
                onClick={() => go(k)}
                style={{
                  textAlign:'left', padding:'18px 4px', background:'transparent',
                  border:'none', borderBottom:'1px solid var(--line)',
                  fontSize: 20, fontWeight: current === k ? 700 : 500,
                  color: current === k ? 'var(--ink)' : 'var(--ink-soft)',
                  fontFamily:'Bricolage Grotesque, sans-serif',
                  cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center'
                }}>
                {label} <Icon d={icons.arrow} size={16}/>
              </button>
            ))}
            <button className="btn btn-primary btn-lg" style={{ width:'100%', marginTop: 24 }} onClick={() => go('catalog')}>
              {t.bookNow}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
window.Header = Header;

// ───────────────────────────────────────────── footer
const Footer = () => {
  const { t, lang, navigate } = useT();
  const linkStyle = { color:'inherit', textDecoration:'none', cursor:'pointer', background:'none', border:'none', padding:0, textAlign:'left', font:'inherit' };
  const FL = ({ onClick, children }) => <button style={linkStyle} onClick={onClick}>{children}</button>;
  return (
    <footer style={{ marginTop: 80, borderTop: '1px solid var(--line)', padding: '48px 0', background: 'var(--bone-2)' }}>
      <div className="container rg-footer" style={{ display:'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 40 }}>
        <div>
          <Logo />
          <p style={{ color:'var(--ink-soft)', marginTop: 16, fontSize: 14, maxWidth: 320 }}>{t.footerTag}</p>
          <p className="mono" style={{ color: 'var(--ink-soft)', marginTop: 20 }}>Av. 5 s/n · Bacalar, Q.Roo</p>
        </div>
        <div>
          <div className="mono" style={{ color: 'var(--ink-soft)', marginBottom: 12 }}>EXPLORE</div>
          <div style={{ display:'flex', flexDirection:'column', gap: 8, fontSize: 14 }}>
            <FL onClick={()=>navigate('catalog', { filter: 'lagoon' })}>{lang==='en'?'Lagoon tours':'Tours de laguna'}</FL>
            <FL onClick={()=>navigate('catalog', { filter: 'ruins' })}>{lang==='en'?'Mayan ruins':'Ruinas mayas'}</FL>
            <FL onClick={()=>navigate('catalog', { filter: 'adventure' })}>{lang==='en'?'Cenotes & adventure':'Cenotes y aventura'}</FL>
            <FL onClick={()=>navigate('catalog', { filter: 'ocean' })}>{lang==='en'?'Reef & beach':'Arrecife y playa'}</FL>
            <FL onClick={()=>navigate('map')}>{t.navMap}</FL>
          </div>
        </div>
        <div>
          <div className="mono" style={{ color: 'var(--ink-soft)', marginBottom: 12 }}>CRUISE GUESTS</div>
          <div style={{ display:'flex', flexDirection:'column', gap: 8, fontSize: 14 }}>
            <FL onClick={()=>navigate('port')}>{lang==='en'?'Mahahual port':'Puerto Mahahual'}</FL>
            <FL onClick={()=>navigate('port')}>{lang==='en'?'Back-to-ship guarantee':'Garantía de regreso al barco'}</FL>
            <FL onClick={()=>navigate('catalog')}>{lang==='en'?'Group bookings':'Reservas de grupo'}</FL>
            <FL onClick={()=>navigate('transfers')}>{t.navTransfers}</FL>
          </div>
        </div>
        <div>
          <div className="mono" style={{ color: 'var(--ink-soft)', marginBottom: 12 }}>COMPANY</div>
          <div style={{ display:'flex', flexDirection:'column', gap: 8, fontSize: 14 }}>
            <FL onClick={()=>navigate('home')}>{lang==='en'?'About':'Nosotros'}</FL>
            <a href="mailto:hola@bacalarallinone.tours" style={linkStyle}>hola@bacalarallinone.tours</a>
            <a href="https://wa.me/529830000000" target="_blank" rel="noopener noreferrer" style={linkStyle}>WhatsApp · +52 983 ·· ····</a>
          </div>
        </div>
      </div>
      <div className="container" style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid var(--line)', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize: 12, color:'var(--ink-soft)', gap: 12 }}>
        <span>© 2026 bacalarallinone.tours</span>
        <div style={{ display:'flex', gap: 14, alignItems:'center' }}>
          <button onClick={()=>navigate('map-debug')} style={{ ...linkStyle, fontFamily:'JetBrains Mono, monospace', fontSize: 10, opacity: 0.7 }} title="Dev: drag pins to calibrate MAP_PINS">PIN DEBUG</button>
          <span className="mono">MADE IN BACALAR · 18.68° N, 88.38° W</span>
        </div>
      </div>
    </footer>
  );
};
window.Footer = Footer;

// ───────────────────────────────────────────── tour card
const TourCard = ({ tour, onClick, compact = false }) => {
  const { t, lang } = useT();
  // Compact stays close to the old layout — used by detail page "related" rail.
  if (compact) {
    return (
      <div className="card fade-in" onClick={onClick} style={{ cursor:'pointer', display:'flex', flexDirection:'column' }}>
        <div style={{ height: 160, position: 'relative', overflow:'hidden' }}>
          <img src={window.tourPhoto(tour)} alt="" loading="lazy"
            style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }}/>
        </div>
        <div style={{ padding: 16, display:'flex', flexDirection:'column', gap: 6 }}>
          <h3 className="display" style={{ margin: 0, fontSize: 18 }}>{tour.title[lang]}</h3>
          <div className="display" style={{ fontSize: 18 }}>${tour.priceAdult}</div>
        </div>
      </div>
    );
  }

  // Photo-dominant card: image fills the tile, title + tagline + price
  // sit overlaid on the bottom half of the photo with a darkening
  // gradient. A solid Book Now button is pinned at the very bottom.
  // aspectRatio keeps every card the same height regardless of copy
  // length so the grid stays clean.
  return (
    // Outer tile: no overflow:hidden so the price label can poke out
    // beyond the rounded corner. Photo + overlays live in an inner
    // wrapper that does the clipping.
    <div
      className="fade-in tour-card-tile"
      onClick={onClick}
      style={{
        cursor: 'pointer',
        position: 'relative',
        aspectRatio: '4/5',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 16,
          overflow: 'hidden',
          background: 'var(--ink)',
          boxShadow: '0 10px 30px rgba(12,42,46,0.18)',
        }}
      >
        <img
          src={window.tourPhoto(tour)}
          alt={tour.title[lang]}
          loading="lazy"
          className="tour-card-img"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {/* Stronger gradient on the bottom 70% so big white type stays readable. */}
        <div
          aria-hidden
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, rgba(12,42,46,0) 30%, rgba(12,42,46,0.55) 60%, rgba(12,42,46,0.92) 100%)',
          }}
        />
        {/* Top-left: category label + audience badges + duration chip.
            Pulled all secondary metadata up here so the title can own the
            bottom of the card uncontested. */}
        <div style={{ position: 'absolute', top: 14, left: 14, right: 110, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
          {tour.location && (
            <span
              className="mono"
              style={{
                background: 'rgba(12,42,46,0.55)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                color: 'var(--bone)',
                fontSize: 11,
                letterSpacing: 1.4,
                padding: '5px 10px',
                borderRadius: 999,
                textTransform: 'uppercase',
              }}
            >
              <Icon d={icons.pin} size={10}/> {tour.location}
            </span>
          )}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {tour.audience.includes('port') && <span className="badge clay dot">{t.filterPort}</span>}
            {tour.flat && <span className="badge jungle">PRIVATE VAN</span>}
            <span
              style={{
                background: 'rgba(12,42,46,0.55)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                color: 'var(--bone)',
                fontSize: 11,
                letterSpacing: 0.6,
                padding: '4px 9px',
                borderRadius: 999,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Icon d={icons.clock} size={11}/> {tour.duration}{t.hr}
            </span>
          </div>
        </div>

        {/* Bottom overlay: title only, oversized — owns the lower half of
            the tile. text-wrap: pretty avoids orphan last lines so the
            base ends with a fuller line of words rather than a single
            stranded word. lang-aware hyphens keep long compound names
            from overflowing on narrower cards. */}
        <div
          style={{
            position: 'absolute',
            left: 0, right: 0, bottom: 0,
            padding: '22px 22px 76px',
            color: 'var(--bone)',
          }}
        >
          <h3
            className="display"
            lang={lang}
            style={{
              margin: 0,
              fontSize: 'clamp(36px, 3.6vw, 52px)',
              lineHeight: 0.98,
              textShadow: '0 2px 14px rgba(0,0,0,0.45)',
              // hyphens:auto needs the lang attribute (set above) and the
              // browser's hyphenation dictionary for that language.
              // hyphenateLimitChars (min-word, before-hyphen, after-hyphen)
              // overrides the conservative defaults so even 5-letter words
              // can be cut, not just the long ones.
              hyphens: 'auto',
              WebkitHyphens: 'auto',
              MsHyphens: 'auto',
              hyphenateLimitChars: '5 2 2',
              WebkitHyphenateLimitChars: '5 2 2',
              // overflow-wrap is the last-resort fallback. Removed the older
              // word-break:break-word — that one cut words mid-letter with
              // NO hyphen, which often beat hyphens:auto to the punch.
              overflowWrap: 'break-word',
            }}
          >
            {tour.title[lang]}
          </h3>
        </div>

        {/* Pinned Book Now strip at the very bottom of the card. */}
        <button
          onClick={onClick}
          className="tour-card-cta"
          style={{
            position: 'absolute',
            left: 14, right: 14, bottom: 14,
            padding: '14px 18px',
            background: 'var(--sun)',
            color: 'var(--ink)',
            border: 'none',
            borderRadius: 10,
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: 15,
            letterSpacing: 0.6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            textTransform: 'uppercase',
          }}
        >
          {lang === 'en' ? 'Book now' : 'Reservar'} <Icon d={icons.arrow} size={15}/>
        </button>
      </div>

      {/* Price label — sticks out of the top-right corner so it reads
          like a hangtag. Sits OUTSIDE the photo wrapper's overflow:hidden
          which is why the wrapper restructure above was needed. */}
      <div
        style={{
          position: 'absolute',
          top: -10,
          right: 16,
          background: 'var(--sun)',
          color: 'var(--ink)',
          padding: '8px 14px',
          borderRadius: 10,
          boxShadow: '0 6px 18px rgba(212,114,42,0.45), 0 1px 2px rgba(0,0,0,0.2)',
          display: 'inline-flex',
          alignItems: 'baseline',
          gap: 5,
          fontWeight: 700,
        }}
      >
        <span className="display" style={{ fontSize: 20, lineHeight: 1 }}>
          ${tour.priceAdult}
        </span>
        <span style={{ fontSize: 11, color: 'var(--ink-2)', fontWeight: 500 }}>
          {tour.flat ? t.perVan : t.perPerson}
        </span>
      </div>
    </div>
  );
};
window.TourCard = TourCard;

// Skeleton tile that mirrors TourCard's footprint while the catalog
// is still loading. Matches the 4:5 aspect ratio + 16px radius so
// swapping skeletons for real cards doesn't reflow the grid.
const TourCardSkeleton = () => (
  <div
    aria-hidden
    style={{
      position: 'relative',
      aspectRatio: '4/5',
      borderRadius: 16,
      overflow: 'hidden',
      background: 'var(--bone-2)',
      boxShadow: '0 10px 30px rgba(12,42,46,0.10)',
    }}
  >
    <div className="skeleton-shimmer" style={{ position: 'absolute', inset: 0 }}/>
    {/* Mimic the category pill on top-left */}
    <div
      style={{
        position: 'absolute',
        top: 14, left: 14,
        width: 110, height: 22,
        borderRadius: 999,
        background: 'rgba(12,42,46,0.10)',
      }}
    />
    {/* Mimic the price tag stub on top-right */}
    <div
      style={{
        position: 'absolute',
        top: -8, right: 16,
        width: 78, height: 36,
        borderRadius: 10,
        background: 'rgba(12,42,46,0.12)',
      }}
    />
    {/* Mimic the title block at the bottom */}
    <div
      style={{
        position: 'absolute',
        left: 22, right: 22, bottom: 86,
        height: 28,
        borderRadius: 6,
        background: 'rgba(12,42,46,0.14)',
      }}
    />
    <div
      style={{
        position: 'absolute',
        left: 22, right: 80, bottom: 56,
        height: 28,
        borderRadius: 6,
        background: 'rgba(12,42,46,0.14)',
      }}
    />
    {/* Mimic the Book Now strip */}
    <div
      style={{
        position: 'absolute',
        left: 14, right: 14, bottom: 14,
        height: 44,
        borderRadius: 10,
        background: 'rgba(12,42,46,0.16)',
      }}
    />
  </div>
);
window.TourCardSkeleton = TourCardSkeleton;

// ───────────────────────────────────────────── DatePicker
// Month-grid calendar for tour booking. Honors the active schedule's
// daysOfWeek + recurrence, blackoutDates, and cutoff window so the
// user can't pick a date the operator hasn't released.
//
// Props:
//   value         – selected ISO date string ("YYYY-MM-DD") or null
//   onChange(iso) – fired when the user picks a valid day
//   schedules     – array of tour.schedules (only `isActive !== false` is used)
//   blackoutDates – array of ISO date strings the operator has flagged
//   cutoffHours   – min hours-before-start required (defaults to 24)
//   minMonths     – how many months to allow forward navigation (default 12)
const DatePicker = ({ value, onChange, schedules = [], blackoutDates = [], cutoffHours = 24, minMonths = 12 }) => {
  const { lang } = useT();
  const today = useMemo(() => {
    const d = new Date(); d.setHours(0,0,0,0); return d;
  }, []);
  const initial = value ? new Date(value + "T00:00:00") : today;
  const [view, setView] = useState({ y: initial.getFullYear(), m: initial.getMonth() });

  const blackoutSet = useMemo(() => new Set(blackoutDates), [blackoutDates]);
  const activeSchedules = (schedules || []).filter((s) => s?.isActive !== false);

  // Earliest allowed day taking cutoff into account (e.g. cutoff 24h means
  // tomorrow is the first selectable date if it's already past midnight today).
  const earliestAllowed = useMemo(() => {
    const e = new Date();
    e.setMinutes(e.getMinutes() + cutoffHours * 60);
    e.setHours(0, 0, 0, 0); // round up to next full day
    return e;
  }, [cutoffHours]);

  const lastViewableDate = useMemo(() => {
    const d = new Date(today);
    d.setMonth(d.getMonth() + minMonths);
    return d;
  }, [today, minMonths]);

  function dayIsAllowedBySchedule(d) {
    // No schedule rows at all → allow everything (legacy tours that haven't
    // been seeded with schedules yet).
    if (activeSchedules.length === 0) return true;
    const iso = d.toISOString().slice(0, 10);
    const dow = d.getDay();
    return activeSchedules.some((s) => {
      if (s.activeFrom && d < new Date(s.activeFrom)) return false;
      if (s.activeTo   && d > new Date(s.activeTo))   return false;
      if (s.recurrence === "daily") return true;
      if (s.recurrence === "weekly") {
        // daysOfWeek may come as a JSON array on the API. Treat empty/missing
        // as "all days".
        const dows = Array.isArray(s.daysOfWeek) ? s.daysOfWeek : [];
        return dows.length === 0 || dows.includes(dow);
      }
      if (s.recurrence === "specific_dates") {
        const list = (s.specificDates || []).map((x) => String(x).slice(0, 10));
        return list.includes(iso);
      }
      return true;
    });
  }

  function dayState(d) {
    if (d < earliestAllowed) return "past";
    if (d > lastViewableDate) return "far";
    const iso = d.toISOString().slice(0, 10);
    if (blackoutSet.has(iso)) return "blackout";
    if (!dayIsAllowedBySchedule(d)) return "off-schedule";
    return "ok";
  }

  // Build the visible month grid: 6 rows × 7 cols, padded with previous /
  // next month days so the layout is stable.
  const cells = useMemo(() => {
    const first = new Date(view.y, view.m, 1);
    // Calendar header order: Mon=0..Sun=6 (en/es local convention).
    const startOffset = (first.getDay() + 6) % 7;
    const start = new Date(first);
    start.setDate(start.getDate() - startOffset);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      d.setHours(0, 0, 0, 0);
      return d;
    });
  }, [view]);

  function step(delta) {
    setView((v) => {
      let y = v.y, m = v.m + delta;
      if (m < 0) { m = 11; y -= 1; }
      if (m > 11) { m = 0; y += 1; }
      return { y, m };
    });
  }

  const monthLabel = new Date(view.y, view.m, 1).toLocaleDateString(
    lang === "en" ? "en-US" : "es-MX",
    { month: "long", year: "numeric" }
  );
  const dowLabels = lang === "en"
    ? ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
    : ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

  // Disable nav buttons that would cross out of the allowed window.
  const canPrev = (view.y > today.getFullYear()) ||
                  (view.y === today.getFullYear() && view.m > today.getMonth());
  const canNext = (view.y < lastViewableDate.getFullYear()) ||
                  (view.y === lastViewableDate.getFullYear() && view.m < lastViewableDate.getMonth());

  return (
    <div className="datepicker" style={{ border: '1px solid var(--line)', borderRadius: 12, padding: 12, background: 'var(--bone)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <button
          type="button"
          onClick={() => canPrev && step(-1)}
          disabled={!canPrev}
          aria-label="Previous month"
          style={{
            width: 32, height: 32, borderRadius: 8, border: '1px solid var(--line)',
            background: 'transparent', cursor: canPrev ? 'pointer' : 'not-allowed',
            opacity: canPrev ? 1 : 0.35, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Icon d={icons.chevronLeft} size={14}/>
        </button>
        <div className="display" style={{ flex: 1, textAlign: 'center', fontSize: 17, textTransform: 'capitalize' }}>
          {monthLabel}
        </div>
        <button
          type="button"
          onClick={() => canNext && step(1)}
          disabled={!canNext}
          aria-label="Next month"
          style={{
            width: 32, height: 32, borderRadius: 8, border: '1px solid var(--line)',
            background: 'transparent', cursor: canNext ? 'pointer' : 'not-allowed',
            opacity: canNext ? 1 : 0.35, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Icon d={icons.chevron} size={14}/>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
        {dowLabels.map((l) => (
          <div key={l} className="mono" style={{ fontSize: 10, textAlign: 'center', color: 'var(--ink-soft)', padding: '4px 0' }}>{l}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {cells.map((d) => {
          const inMonth = d.getMonth() === view.m;
          const iso = d.toISOString().slice(0, 10);
          const state = dayState(d);
          const selected = value === iso;
          const disabled = state !== "ok" || !inMonth;
          let bg = 'transparent', color = 'var(--ink)', border = '1px solid transparent';
          if (!inMonth) color = 'var(--ink-soft)';
          if (state === 'past' || state === 'far') { color = 'rgba(74,106,110,0.45)'; }
          if (state === 'blackout' || state === 'off-schedule') {
            color = 'rgba(74,106,110,0.55)';
            border = '1px dashed var(--line)';
          }
          if (selected) { bg = 'var(--ink)'; color = 'var(--bone)'; border = '1px solid var(--ink)'; }
          return (
            <button
              key={iso + '-' + d.getMonth()}
              type="button"
              onClick={() => !disabled && onChange(iso)}
              disabled={disabled}
              className={`datepicker-day${selected ? ' is-selected' : ''}`}
              title={
                state === 'blackout'      ? (lang === 'en' ? 'Unavailable date'           : 'Fecha no disponible') :
                state === 'off-schedule'  ? (lang === 'en' ? 'Tour does not run that day' : 'El tour no opera ese día') :
                state === 'past'          ? (lang === 'en' ? 'Past or before cutoff'      : 'Pasado o antes del cutoff') :
                undefined
              }
              style={{
                aspectRatio: '1 / 1',
                borderRadius: 8,
                background: bg,
                color,
                border,
                fontSize: 13,
                fontWeight: selected ? 700 : 500,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: !inMonth ? 0.3 : 1,
                position: 'relative',
                textDecoration: state === 'blackout' ? 'line-through' : 'none',
                transition: 'background-color 140ms ease, border-color 140ms ease, transform 140ms ease',
              }}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 10, color: 'var(--ink-soft)', flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--ink)' }}/>
          {lang === 'en' ? 'Selected' : 'Seleccionado'}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, border: '1px dashed var(--line-strong)' }}/>
          {lang === 'en' ? 'Unavailable' : 'No disponible'}
        </span>
      </div>
    </div>
  );
};
window.DatePicker = DatePicker;

// ───────────────────────────────────────────── Interactive Map
const MiniMap = ({ onPinClick, selected }) => {
  const { t, lang } = useT();
  return (
    <div style={{ position:'relative', width:'100%', aspectRatio: '4 / 3', borderRadius: 'var(--radius-lg)', overflow:'hidden',
      background: 'var(--bone-2)',
      border: '1px solid var(--line)'
    }}>
      {/* illustrated territory map (Gemini-generated, 4:3) */}
      <img src="./images/territory-map-1600.webp" alt="" loading="lazy"
        style={{ position:'absolute', inset: 0, width:'100%', height:'100%', objectFit:'cover', pointerEvents:'none' }}
        onError={(e)=>{ e.target.style.display='none'; }}/>
      {/* subtle warm paper overlay for legibility over lighter areas */}
      <div style={{ position:'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(246,241,230,0) 55%, rgba(12,42,46,0.08) 100%)', pointerEvents:'none' }}/>

      {/* route lines — subtle hand-drawn feel. viewBox uses 100×100 to match pin % coords. */}
      <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%' }} viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Cancún → Tulum → Bacalar → Mahahual */}
        <path d="M69.18,9.09 L60.09,32.62 L41.79,70.87 L60.87,75.02" stroke="var(--ink)" strokeWidth="0.25" strokeDasharray="0.8 0.8" fill="none" opacity="0.55"/>
        {/* Chichén Itzá → Tulum */}
        <path d="M30.50,21.03 L60.09,32.62" stroke="var(--ink)" strokeWidth="0.25" strokeDasharray="0.8 0.8" fill="none" opacity="0.55"/>
      </svg>

      {/* pins — DOT is anchored at (x%, y%); label floats absolutely below so it doesn't move the dot */}
      {window.MAP_PINS.map(pin => {
        const isSelected = selected === pin.id;
        return (
          <button key={pin.id}
            onClick={() => onPinClick && onPinClick(pin)}
            style={{
              position:'absolute', left: `${pin.x}%`, top: `${pin.y}%`,
              transform: 'translate(-50%, -50%)',
              background: 'none', border:'none', cursor:'pointer',
              width: 16, height: 16, padding: 0
            }}>
            <div style={{
              position:'absolute', left:'50%', top:'50%', width: 26, height: 26,
              transform:'translate(-50%, -50%)', pointerEvents:'none'
            }}>
              <div className="pin-pulse" style={{
                width:'100%', height:'100%', borderRadius:'50%',
                background: isSelected ? 'var(--sun)' : 'var(--clay)', opacity: 0.35
              }}/>
            </div>
            <div style={{
              position:'absolute', left:'50%', top:'50%', width: 16, height: 16, borderRadius:'50%',
              transform:'translate(-50%, -50%)',
              background: isSelected ? 'var(--sun)' : 'var(--clay)',
              border: '2.5px solid var(--bone)', boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              zIndex: 1
            }}/>
            <span className="mono" style={{
              position:'absolute', left:'50%', top:'calc(100% + 6px)', transform:'translateX(-50%)',
              background: 'var(--bone)', padding: '2px 6px', borderRadius: 4,
              fontSize: 9, boxShadow: '0 1px 2px rgba(0,0,0,0.1)', whiteSpace:'nowrap',
              color: 'var(--ink)'
            }}>{pin.name}</span>
          </button>
        );
      })}

      {/* compass */}
      <div style={{ position:'absolute', bottom: 16, left: 16, width: 54, height: 54, borderRadius:'50%',
        background: 'var(--bone)', display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow: 'var(--shadow)' }}>
        <div className="mono" style={{ fontSize: 9, color:'var(--ink-soft)' }}>N</div>
        <div style={{ position:'absolute', width: 2, height: 22, background: 'var(--clay)', top: 8, borderRadius: 2 }}/>
      </div>
      <div className="mono" style={{ position:'absolute', bottom: 16, right: 16, fontSize: 10, color:'var(--ink)', background:'var(--bone)', padding:'4px 8px', borderRadius: 4 }}>
        {t.navMap} · Q. Roo, MX
      </div>
    </div>
  );
};
window.MiniMap = MiniMap;

// ───────────────────────────────────────────── star row
window.Stars = ({ rating, size = 12 }) => (
  <span style={{ display:'inline-flex', gap: 1, color: 'var(--sun-2)' }}>
    {[1,2,3,4,5].map(i => (
      <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i <= Math.round(rating) ? 'currentColor' : 'transparent'} stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    ))}
  </span>
);

// ───────────────────────────────────────────── WhatsApp widget
const WAWidget = () => {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  return (
    <>
      {open && (
        <div className="fade-in" style={{
          position:'fixed', bottom: 96, right: 24, width: 320, zIndex: 99,
          background: 'var(--bone)', borderRadius: 16, boxShadow: 'var(--shadow)',
          border: '1px solid var(--line)', overflow:'hidden'
        }}>
          <div style={{ background: '#128C7E', color: 'white', padding: '14px 16px', display:'flex', alignItems:'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius:'50%', background:'#25D366', display:'flex', alignItems:'center', justifyContent:'center', color:'white' }}>
              <Icon d={icons.whatsapp} size={18}/>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>bacalarallinone · Concierge</div>
              <div style={{ fontSize: 11, opacity: 0.9 }}>● Online · replies in ~2 min</div>
            </div>
          </div>
          <div style={{ padding: 16, background: '#ece5dd' }}>
            <div style={{ background: 'white', padding: '8px 12px', borderRadius: '0 10px 10px 10px', fontSize: 13, maxWidth:'85%', boxShadow: '0 1px 1px rgba(0,0,0,0.08)' }}>
              {t.chatPlaceholder}
            </div>
          </div>
          <div style={{ padding: 10, display:'flex', gap: 8 }}>
            <input className="input" placeholder="Message…" style={{ fontSize: 13, padding: '8px 12px' }}/>
            <button className="btn btn-sm" style={{ background: '#25D366', color:'white' }}><Icon d={icons.send} size={14}/></button>
          </div>
        </div>
      )}
      <button onClick={() => setOpen(!open)} style={{
        position:'fixed', bottom: 24, right: 24, zIndex: 99,
        width: 56, height: 56, borderRadius:'50%',
        background: '#25D366', color:'white', border:'none', cursor:'pointer',
        boxShadow: '0 6px 20px rgba(37,211,102,0.4)',
        display:'flex', alignItems:'center', justifyContent:'center'
      }}>
        <Icon d={open ? icons.x : icons.whatsapp} size={24}/>
      </button>
    </>
  );
};
window.WAWidget = WAWidget;

// ───────────────────────────────────────────── SEO head
// Dynamic <title>, <meta>, Open Graph, Twitter, canonical, and JSON-LD per route.
// Reads from tour data fields — no hand-written final copy here, just plumbing.
const SEO_SITE = {
  name: 'bacalarallinone.tours',
  origin: 'https://bacalarallinone.tours',
  defaultOg: './images/hero-lagoon-1600.webp',
};

const setMeta = (selector, attr, value) => {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    const [, k, v] = selector.match(/\[(\w+)="([^"]+)"\]/) || [];
    if (k && v) el.setAttribute(k, v);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
};
const setLink = (rel, href) => {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) { el = document.createElement('link'); el.setAttribute('rel', rel); document.head.appendChild(el); }
  el.setAttribute('href', href);
};
const setJsonLd = (id, data) => {
  let el = document.head.querySelector(`script[data-seo="${id}"]`);
  if (data == null) { if (el) el.remove(); return; }
  if (!el) {
    el = document.createElement('script');
    el.setAttribute('type', 'application/ld+json');
    el.setAttribute('data-seo', id);
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
};

const routePath = (route) => {
  if (!route || !route.page || route.page === 'home') return '/';
  const p = route.params || {};
  switch (route.page) {
    case 'catalog':    return p.filter ? `/tours/${p.filter}` : '/tours';
    case 'detail':     return p.tourId ? `/tour/${p.tourId}` : '/tour';
    case 'booking':    return '/booking';
    case 'port':       return '/port';
    case 'transfers':  return '/transfers';
    case 'map':        return p.focus ? `/map/${p.focus}` : '/map';
    case 'map-debug':  return '/map-debug';
    default:           return '/' + route.page;
  }
};

const SEOHead = () => {
  const { lang, navigate } = useT();
  // Re-read route on each render (pulled from app ctx via window; we don't have route in ctx)
  // Easiest: subscribe to a lightweight store by reading window.__route that App pushes.
  const [route, setRouteLocal] = useState(() => window.__route || { page: 'home', params: {} });
  useEffect(() => {
    const handler = () => setRouteLocal(window.__route || { page: 'home', params: {} });
    window.addEventListener('__routechange', handler);
    handler();
    return () => window.removeEventListener('__routechange', handler);
  }, []);

  useEffect(() => {
    const path = routePath(route);
    const url = `${SEO_SITE.origin}${path}`;
    const htmlLang = lang === 'es' ? 'es' : 'en';
    document.documentElement.setAttribute('lang', htmlLang);

    let title = SEO_SITE.name;
    let description = '';
    let ogImage = SEO_SITE.defaultOg;
    let ogType = 'website';
    let jsonLd = null;

    const TOURS = window.TOURS || [];
    if (route.page === 'detail') {
      const tour = TOURS.find(x => x.id === route.params?.tourId);
      if (tour) {
        title = `${tour.title[lang]} — ${SEO_SITE.name}`;
        description = tour.tagline?.[lang] || '';
        ogImage = (window.tourPhoto && window.tourPhoto(tour)) || ogImage;
        ogType = 'product';
        jsonLd = {
          '@context': 'https://schema.org',
          '@type': 'TouristTrip',
          name: tour.title[lang],
          description,
          image: url.replace(path, '') + (ogImage.startsWith('./') ? ogImage.slice(1) : ogImage),
          url,
          touristType: tour.audience,
          provider: { '@type': 'TravelAgency', name: SEO_SITE.name, url: SEO_SITE.origin },
          offers: {
            '@type': 'Offer',
            priceCurrency: 'USD',
            price: tour.priceAdult,
            availability: 'https://schema.org/InStock',
            url
          },
          aggregateRating: tour.rating && tour.reviews ? {
            '@type': 'AggregateRating',
            ratingValue: tour.rating,
            reviewCount: tour.reviews,
            bestRating: 5,
            worstRating: 1
          } : undefined
        };
      }
    } else if (route.page === 'catalog') {
      title = `${lang === 'en' ? 'Tours & adventures' : 'Tours y aventuras'} — ${SEO_SITE.name}`;
      description = '';
    } else if (route.page === 'port') {
      title = `${lang === 'en' ? 'Cruise port tours' : 'Tours de puerto'} — ${SEO_SITE.name}`;
    } else if (route.page === 'transfers') {
      title = `${lang === 'en' ? 'Airport transfers' : 'Traslados aeropuerto'} — ${SEO_SITE.name}`;
    } else if (route.page === 'map') {
      title = `${lang === 'en' ? 'Destinations map' : 'Mapa de destinos'} — ${SEO_SITE.name}`;
    } else if (route.page === 'booking') {
      title = `${lang === 'en' ? 'Checkout' : 'Finalizar compra'} — ${SEO_SITE.name}`;
    }

    // Apply
    document.title = title;
    setMeta('meta[name="description"]', 'content', description || (window.I18N?.[lang]?.heroSub || ''));
    setMeta('meta[property="og:title"]',       'content', title);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:url"]',         'content', url);
    setMeta('meta[property="og:image"]',       'content', ogImage);
    setMeta('meta[property="og:type"]',        'content', ogType);
    setMeta('meta[property="og:locale"]',      'content', htmlLang === 'es' ? 'es_MX' : 'en_US');
    setMeta('meta[name="twitter:title"]',       'content', title);
    setMeta('meta[name="twitter:description"]', 'content', description);
    setMeta('meta[name="twitter:image"]',       'content', ogImage);
    setLink('canonical', url);
    setJsonLd('tour', jsonLd);
  }, [route, lang]);

  return null;
};
window.SEOHead = SEOHead;

// ───────────────────────────────────────────── lightbox / fullscreen gallery
// Strip derivative suffix so we show the highest-quality master.
const toMaster = (src) => typeof src === 'string' ? src.replace(/-(?:800|1600)\.webp$/, '.webp') : src;

const Lightbox = ({ photos, open, initialIndex = 0, onClose }) => {
  const { t, lang } = useT();
  const [idx, setIdx] = useState(initialIndex);
  const touchRef = useRef({ x: 0, y: 0 });

  useEffect(() => { if (open) setIdx(initialIndex); }, [open, initialIndex]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIdx(i => Math.min((photos?.length || 1) - 1, i + 1));
      if (e.key === 'ArrowLeft')  setIdx(i => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, photos, onClose]);

  if (!open || !photos || photos.length === 0) return null;
  const safeIdx = Math.max(0, Math.min(photos.length - 1, idx));
  const photo = photos[safeIdx];

  const prev = (e) => { e && e.stopPropagation(); setIdx(i => Math.max(0, i - 1)); };
  const next = (e) => { e && e.stopPropagation(); setIdx(i => Math.min(photos.length - 1, i + 1)); };

  const onTouchStart = (e) => {
    const t0 = e.touches[0];
    touchRef.current = { x: t0.clientX, y: t0.clientY };
  };
  const onTouchEnd = (e) => {
    const t1 = e.changedTouches[0];
    const dx = t1.clientX - touchRef.current.x;
    const dy = t1.clientY - touchRef.current.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) next(); else prev();
    }
  };

  return (
    <div
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className="fade-in"
      style={{
        position:'fixed', inset: 0, zIndex: 200,
        background: 'rgba(12,42,46,0.94)',
        display:'flex', alignItems:'center', justifyContent:'center'
      }}>
      {/* counter + close */}
      <div style={{ position:'absolute', top: 20, left: 24, right: 24, display:'flex', justifyContent:'space-between', alignItems:'center', color: 'var(--bone)', zIndex: 2 }}>
        <span className="mono" style={{ opacity: 0.75, fontSize: 12 }}>
          {safeIdx + 1} / {photos.length}{photo.label ? ` · ${photo.label}` : ''}
        </span>
        <button onClick={(e)=>{ e.stopPropagation(); onClose(); }} aria-label={t.cancel || 'Close'}
          style={{
            width: 42, height: 42, borderRadius: 10,
            background: 'rgba(246,241,230,0.12)', color: 'var(--bone)',
            border: '1px solid rgba(246,241,230,0.2)', cursor: 'pointer',
            display:'flex', alignItems:'center', justifyContent:'center'
          }}>
          <Icon d={icons.x} size={18}/>
        </button>
      </div>

      {/* prev */}
      {safeIdx > 0 && (
        <button onClick={prev} aria-label="Previous"
          style={{
            position:'absolute', left: 20, top:'50%', transform: 'translateY(-50%)',
            width: 48, height: 48, borderRadius:'50%',
            background: 'rgba(246,241,230,0.12)', color: 'var(--bone)',
            border: '1px solid rgba(246,241,230,0.2)', cursor: 'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', zIndex: 2
          }}>
          <Icon d={icons.chevronLeft} size={22}/>
        </button>
      )}
      {/* next */}
      {safeIdx < photos.length - 1 && (
        <button onClick={next} aria-label="Next"
          style={{
            position:'absolute', right: 20, top:'50%', transform: 'translateY(-50%)',
            width: 48, height: 48, borderRadius:'50%',
            background: 'rgba(246,241,230,0.12)', color: 'var(--bone)',
            border: '1px solid rgba(246,241,230,0.2)', cursor: 'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', zIndex: 2
          }}>
          <Icon d={icons.chevron} size={22}/>
        </button>
      )}

      {/* image */}
      <img
        key={safeIdx}
        src={toMaster(photo.src)}
        alt={photo.label || ''}
        onClick={(e)=>e.stopPropagation()}
        style={{
          maxWidth: '92vw', maxHeight: '82vh',
          objectFit: 'contain', borderRadius: 10,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          animation: 'fadeIn 240ms ease'
        }}
        onError={(e)=>{ /* fallback to the original src if master is missing */ if (e.target.src !== photo.src) e.target.src = photo.src; }}
      />

      {/* thumb strip */}
      {photos.length > 1 && (
        <div onClick={(e)=>e.stopPropagation()}
          style={{
            position:'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            display:'flex', gap: 8, padding: 8, borderRadius: 12,
            background: 'rgba(246,241,230,0.08)', border: '1px solid rgba(246,241,230,0.15)',
            maxWidth: '92vw', overflowX: 'auto', zIndex: 2
          }}>
          {photos.map((p, i) => (
            <button key={i} onClick={()=>setIdx(i)}
              style={{
                width: 56, height: 42, borderRadius: 6, flexShrink: 0,
                overflow: 'hidden', padding: 0,
                border: i === safeIdx ? '2px solid var(--bone)' : '1px solid rgba(246,241,230,0.25)',
                cursor: 'pointer', background: 'transparent'
              }}>
              <img src={p.src} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', opacity: i === safeIdx ? 1 : 0.65 }}/>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
window.Lightbox = Lightbox;

// ───────────────────────────────────────────── toast
const Toast = () => {
  const { toast } = useT();
  if (!toast) return null;
  return (
    <div className="fade-in" style={{
      position:'fixed', bottom: 100, left:'50%', transform:'translateX(-50%)',
      zIndex: 150, display:'flex', alignItems:'center', gap: 10,
      padding: '12px 20px', borderRadius: 999,
      background: 'var(--ink)', color: 'var(--bone)',
      boxShadow: '0 10px 28px rgba(0,0,0,0.25)',
      fontSize: 14, fontWeight: 500
    }}>
      <div style={{ width: 20, height: 20, borderRadius:'50%', background:'var(--lagoon)', color:'var(--ink)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Icon d={icons.check} size={12} stroke={3}/>
      </div>
      {toast}
    </div>
  );
};
window.Toast = Toast;

// ───────────────────────────────────────────── cart drawer
const CartDrawer = () => {
  const { t, lang, cart, cartOpen, closeCart, removeFromCart, cartTotal, navigate, clearCart } = useT();

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && cartOpen) closeCart(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = cartOpen ? 'hidden' : '';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [cartOpen]);

  const checkout = () => {
    if (!cart.length) return;
    closeCart();
    navigate('booking', { cart, total: cartTotal });
  };

  return (
    <>
      {cartOpen && (
        <div
          onClick={closeCart}
          style={{
            position:'fixed', inset: 0, zIndex: 120, background: 'rgba(12,42,46,0.45)',
            backdropFilter: 'blur(2px)'
          }}
          className="fade-in"
        />
      )}
      <aside
        aria-hidden={!cartOpen}
        style={{
          position:'fixed', top: 0, right: 0, bottom: 0, zIndex: 121,
          width: 'min(420px, 100vw)', background: 'var(--bone)',
          borderLeft: '1px solid var(--line)', boxShadow: 'var(--shadow)',
          transform: cartOpen ? 'translateX(0)' : 'translateX(105%)',
          transition: 'transform 280ms cubic-bezier(.2,.8,.2,1)',
          display:'flex', flexDirection:'column'
        }}>
        <div style={{ padding: '20px 22px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid var(--line)' }}>
          <div>
            <div className="mono" style={{ color:'var(--ink-soft)' }}>{t.yourCart}</div>
            <h3 className="display" style={{ fontSize: 24, margin:'4px 0 0' }}>
              {cart.length} {cart.length === 1 ? t.item : t.items}
            </h3>
          </div>
          <button onClick={closeCart} style={{
            width: 36, height: 36, borderRadius: 8, border:'1px solid var(--line)',
            background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center'
          }} aria-label={t.cancel}>
            <Icon d={icons.x} size={16}/>
          </button>
        </div>

        <div style={{ flex: 1, overflowY:'auto', padding: '16px 22px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign:'center', padding: '40px 10px', color:'var(--ink-soft)' }}>
              <div style={{ width: 64, height: 64, borderRadius:'50%', background:'var(--bone-2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
                <Icon d={icons.bag} size={26}/>
              </div>
              <div className="display" style={{ fontSize: 20, color:'var(--ink)', marginBottom: 6 }}>{t.emptyCart}</div>
              <div style={{ fontSize: 13 }}>{t.emptyCartSub}</div>
              <button className="btn btn-outline" style={{ marginTop: 18 }} onClick={()=>{ closeCart(); navigate('catalog'); }}>
                {t.enterCatalog}
              </button>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap: 14 }}>
              {cart.map(item => {
                const tour = window.TOURS.find(x => x.id === item.tourId);
                if (!tour) return null;
                return (
                  <div key={item.id} className="card" style={{ padding: 12, display:'flex', gap: 12 }}>
                    <div style={{ width: 86, height: 86, borderRadius: 10, overflow:'hidden', flexShrink: 0, background:'var(--bone-2)' }}>
                      <img src={window.tourPhoto(tour)} alt="" loading="lazy"
                        style={{ width:'100%', height:'100%', objectFit:'cover' }}
                        onError={(e)=>{ e.target.style.display='none'; }}/>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.2, marginBottom: 4 }}>{tour.title[lang]}</div>
                      <div className="mono" style={{ color:'var(--ink-soft)', fontSize: 10 }}>
                        {item.date} · {item.time}
                      </div>
                      <div className="mono" style={{ color:'var(--ink-soft)', fontSize: 10, marginTop: 2 }}>
                        {tour.flat
                          ? '1 van'
                          : `${item.adults || 0} ${t.adults.toLowerCase()}${item.kids ? ` · ${item.kids} ${t.kids.toLowerCase()}` : ''}`
                        }
                      </div>
                      {item.pickup && item.pickup.label && (
                        <div className="mono" style={{ color:'var(--ink-soft)', fontSize: 10, marginTop: 2 }}>
                          <Icon d={icons.pin} size={9}/> {item.pickup.label[lang]}
                        </div>
                      )}
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginTop: 8 }}>
                        <span className="display" style={{ fontSize: 18 }}>${Number(item.subtotal).toLocaleString()}</span>
                        <button onClick={()=>removeFromCart(item.id)} title={t.remove}
                          style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--ink-soft)', padding: 4 }}>
                          <Icon d={icons.trash} size={14}/>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {cart.length > 1 && (
                <button onClick={clearCart}
                  style={{ alignSelf:'flex-end', background:'transparent', border:'none', color:'var(--ink-soft)', fontSize: 12, cursor:'pointer', textDecoration:'underline' }}>
                  {lang === 'en' ? 'Clear all' : 'Vaciar todo'}
                </button>
              )}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div style={{ padding: '18px 22px', borderTop:'1px solid var(--line)', background:'var(--bone-2)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom: 12 }}>
              <span className="mono" style={{ color:'var(--ink-soft)' }}>{t.subtotal}</span>
              <span className="display" style={{ fontSize: 28 }}>${cartTotal.toLocaleString()}</span>
            </div>
            <button className="btn btn-sun btn-lg" style={{ width:'100%' }} onClick={checkout}>
              {t.checkout} <Icon d={icons.arrow} size={14}/>
            </button>
            <button className="btn btn-ghost btn-sm" style={{ width:'100%', marginTop: 6 }} onClick={()=>{ closeCart(); navigate('catalog'); }}>
              {t.continueShopping}
            </button>
          </div>
        )}
      </aside>
    </>
  );
};
window.CartDrawer = CartDrawer;

// expose hooks
Object.assign(window, { useState, useEffect, useMemo, useRef, useCallback });
