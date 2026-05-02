// Home page — audience split + featured + why us
const Home = () => {
  const { t, lang, navigate, openLightbox } = useT();
  const featured = window.TOURS.slice(0, 6);
  // Track which path-tile illustrations have actually loaded so we
  // can fade them in over a shimmer skeleton instead of popping.
  const [loadedIllos, setLoadedIllos] = useState({});
  // Defer the entrance animation until the section actually scrolls
  // into view, so a user landing higher up still gets to see the
  // bouncy load when they reach the "Pick your path" block.
  const pathSectionRef = useRef(null);
  const [pathInView, setPathInView] = useState(false);
  useEffect(() => {
    const el = pathSectionRef.current;
    if (!el || pathInView) return;
    if (typeof IntersectionObserver === 'undefined') {
      setPathInView(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setPathInView(true);
          obs.disconnect();
        }
      },
      // Wait until ~35% of the section is on screen before firing.
      // Catches the user when they're slowing down to actually look at
      // the section instead of triggering during a fast scroll past.
      { rootMargin: '0px 0px -10% 0px', threshold: 0.35 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [pathInView]);
  const heroShots = [
    { src: window.PHOTOS.lagoonBoat, label: 'BACALAR LAGOON' },
    { src: window.PHOTOS.chacchoben, label: 'CHACCHOBEN'     },
    { src: window.PHOTOS.cenote,     label: 'CENOTE'         }
  ];

  return (
    <div className="fade-in">
      {/* HERO */}
      <section style={{ position:'relative', overflow:'hidden', paddingTop: 48, paddingBottom: 60 }}>
        <div className="container rg" style={{ display:'grid', gridTemplateColumns: '1.1fr 1fr', gap: 48, alignItems:'center' }}>
          <div>
            <div className="hero-item d0" style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: 24 }}>
              <span className="mono" style={{ color:'var(--ink-soft)' }}>{t.heroKicker}</span>
              <span style={{ flex: 1, height: 1, background: 'var(--line-strong)' }}/>
            </div>
            <h1 className="display hero-item d1" style={{ fontSize: 'clamp(48px, 6vw, 84px)', margin: 0, lineHeight: 0.92 }}>
              {t.heroTitle}<br/>
              <span style={{ color: 'var(--clay)' }}>{t.heroTitleItalic}</span>
            </h1>
            {/* Brush-script accent — short tropical pull-quote echoing
                the "bacalar" stroke in the logo. */}
            <div className="script hero-item d1" style={{ fontSize: 32, color: 'var(--lagoon-deep)', marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <span>{lang==='en' ? 'seven colors, no rush' : 'siete colores, sin prisa'}</span>
              <WaveMark color="lagoon" width={56} height={10} strokeWidth={2.4}/>
            </div>
            <p className="hero-item d2" style={{ fontSize: 18, color:'var(--ink-soft)', marginTop: 18, maxWidth: 520, lineHeight: 1.4 }}>
              {t.heroSub}
            </p>
            <div className="hero-item d3" style={{ display:'flex', gap: 12, marginTop: 32, flexWrap:'wrap' }}>
              <button className="btn btn-primary btn-lg" onClick={() => navigate('catalog')}>
                {t.enterCatalog} <Icon d={icons.arrow} size={16}/>
              </button>
              <button className="btn btn-outline btn-lg" onClick={() => navigate('port')}>
                <Icon d={icons.ship} size={16}/> {t.enterPortFlow}
              </button>
            </div>
            <div className="rg-stats hero-item d4" style={{ display:'flex', gap: 28, marginTop: 40, flexWrap:'wrap' }}>
              {[
                { n: '12K+', l: lang==='en'?'Happy travelers':'Viajeros felices' },
                { n: '4.9★', l: lang==='en'?'Avg. rating':'Calificación' },
                { n: '14', l: lang==='en'?'Curated tours':'Tours curados' }
              ].map((s,i) => (
                <div key={i}>
                  <div className="display" style={{ fontSize: 32 }}>{s.n}</div>
                  <div className="mono" style={{ color:'var(--ink-soft)' }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero collage — rotations via CSS custom property so hover can straighten them */}
          <div className="rg-hero-collage" style={{ position:'relative', aspectRatio:'5/6' }}>
            <div onClick={()=>openLightbox(heroShots, 0)} className="hero-card c1"
              style={{ position:'absolute', inset: '0 20% 30% 0', borderRadius: 24, boxShadow: 'var(--shadow)', overflow:'hidden' }}>
              <window.Photo src={heroShots[0].src} label={heroShots[0].label} style={{ width:'100%', height:'100%' }}/>
            </div>
            <div onClick={()=>openLightbox(heroShots, 1)} className="hero-card c2"
              style={{ position:'absolute', inset: '35% 0 15% 35%', borderRadius: 24, boxShadow: 'var(--shadow)', overflow:'hidden' }}>
              <window.Photo src={heroShots[1].src} label={heroShots[1].label} style={{ width:'100%', height:'100%' }}/>
            </div>
            <div onClick={()=>openLightbox(heroShots, 2)} className="hero-card c3"
              style={{ position:'absolute', inset: '55% 45% 0 5%', borderRadius: 20, boxShadow: 'var(--shadow)', overflow:'hidden' }}>
              <window.Photo src={heroShots[2].src} label={heroShots[2].label} style={{ width:'100%', height:'100%' }}/>
            </div>
            {/* floating data tag */}
            <div className="hero-tag" style={{ position:'absolute', top: '8%', right: 0, background:'var(--bone)', padding:'12px 16px', borderRadius: 12, boxShadow: 'var(--shadow)', transform:'rotate(4deg)', zIndex: 4 }}>
              <div className="mono" style={{ color:'var(--ink-soft)' }}>LIVE</div>
              <div style={{ display:'flex', alignItems:'center', gap: 6, marginTop: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius:'50%', background: '#2ecc71' }} className="pin-pulse"/>
                <span style={{ fontSize: 13, fontWeight: 600 }}>28°C · sunny</span>
              </div>
            </div>
            <div className="hero-tag d2" style={{ position:'absolute', bottom: '18%', right: '8%', background:'var(--ink)', color:'var(--bone)', padding:'10px 14px', borderRadius: 10, boxShadow: 'var(--shadow)', transform:'rotate(-3deg)', zIndex: 4 }}>
              <div className="mono" style={{ opacity: 0.7 }}>NEXT SAILING</div>
              <div style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>Today · 16:30 · 4 seats</div>
            </div>
          </div>
        </div>
      </section>

      {/* PICK YOUR PATH — color-blocked navigation tiles. No photos so
          they don't compete with the photo-driven hero collage above
          and the photo-dominant tour cards below. The big in-card
          glyph + brand-color background gives them a distinct visual
          rhythm of their own. */}
      <section ref={pathSectionRef} className="container" style={{ paddingTop: 40, paddingBottom: 40 }}>
        <div style={{ display:'flex', alignItems:'baseline', gap: 16, marginBottom: 16 }}>
          <div>
            <h2 className="display" style={{ fontSize: 36, margin: 0 }}>{t.pickPath}</h2>
            <WaveMark color="lagoon" width={96} height={12} strokeWidth={2.6}/>
          </div>
          <div style={{ flex: 1, height: 1, background:'var(--line)' }}/>
        </div>

        <div className="rg-3" style={{ display:'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 36 }}>
          {[
            { key: 'port',     n: '01', illo: './images/path-port.png',     title: t.pathPort,     sub: t.pathPortSub,     cta: t.enterPortFlow, target: 'port',      accent: 'var(--clay)' },
            { key: 'regular',  n: '02', illo: './images/path-regular.png',  title: t.pathRegular,  sub: t.pathRegularSub,  cta: t.enterCatalog,  target: 'catalog',   accent: 'var(--lagoon-deep)' },
            { key: 'transfer', n: '03', illo: './images/path-transfer.png', title: t.pathTransfer, sub: t.pathTransferSub, cta: t.enterTransfer, target: 'transfers', accent: 'var(--jungle-2)' }
          ].map((path, idx) => {
            const loaded = !!loadedIllos[path.key];
            // Run the bouncy entrance only when the section is in
            // view AND the PNG has already arrived from the network.
            const animate = loaded && pathInView;
            const badgeIcon =
              path.key === 'port'    ? icons.ship
            : path.key === 'regular' ? icons.compass
            :                          icons.bus;
            return (
              <div
                key={path.key}
                className="path-tile"
                onClick={() => navigate(path.target)}
                style={{
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                {/* Illustration sits free on the page — no card, no
                    border, no colored backdrop. While the PNG loads
                    we show a shimmer in the exact slot so layout
                    doesn't shift on swap. */}
                <div
                  className="path-tile-illo-wrap"
                  style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '800 / 687',
                  }}
                >
                  {!loaded && (
                    <div
                      aria-hidden
                      className="skeleton-shimmer"
                      style={{
                        position: 'absolute',
                        inset: '8% 8%',
                        background: 'rgba(12,42,46,0.06)',
                        borderRadius: 24,
                      }}
                    />
                  )}
                  <img
                    src={path.illo}
                    alt=""
                    loading="lazy"
                    onLoad={() => setLoadedIllos((p) => ({ ...p, [path.key]: true }))}
                    className={`path-tile-illo ${animate ? 'path-tile-illo--in' : ''}`}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      // Stagger the transition so the three stickers
                      // ease in one after another instead of all at once.
                      transitionDelay: `${idx * 200}ms`,
                    }}
                  />
                  {/* Icon badge floating at the bottom-side corner of
                      the illustration — brand-color disc with a white
                      glyph. Sits on top of the sticker so it reads as
                      a section-mark stamp. */}
                  <div
                    className="path-tile-badge"
                    aria-hidden
                    style={{
                      position: 'absolute',
                      bottom: '4%',
                      right: '6%',
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: path.accent,
                      color: 'var(--bone)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 18px rgba(12,42,46,0.22), 0 0 0 4px var(--bone)',
                    }}
                  >
                    <Icon d={badgeIcon} size={26} stroke={2}/>
                  </div>
                </div>

                {/* Section meta: oversized brand-color number with a
                    brush-style wave squiggle underneath echoing the
                    logo's wave below "bacalar". Mono caption sits to
                    the right on the same baseline. */}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span
                      className="display"
                      style={{
                        fontSize: 'clamp(40px, 4vw, 56px)',
                        lineHeight: 0.9,
                        color: path.accent,
                        fontWeight: 700,
                      }}
                    >
                      {path.n}
                    </span>
                    <WaveMark color={path.accent} width={64} height={10} strokeWidth={2.4}/>
                  </div>
                  <span
                    className="mono"
                    style={{
                      color: path.accent,
                      letterSpacing: 1.4,
                      fontSize: 11,
                      opacity: 0.85,
                      paddingBottom: 10,
                    }}
                  >
                    / {path.title.toUpperCase()}
                  </span>
                </div>

                {/* Wrapper reserves room for up to 2 lines and pushes the
                    title to the BOTTOM of that block. Result: titles
                    that wrap stay where they are; titles that fit on
                    one line drop to the same baseline as the wrapped
                    ones — so the title-base across all three tiles
                    aligns horizontally regardless of length. */}
                <div
                  style={{
                    minHeight: '2.04em',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    fontSize: 'clamp(26px, 2.4vw, 32px)',
                  }}
                >
                  <h3
                    className="display"
                    style={{
                      margin: 0,
                      fontSize: 'inherit',
                      lineHeight: 1.02,
                      color: 'var(--ink)',
                    }}
                  >
                    {path.title}
                  </h3>
                </div>

                <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 14, lineHeight: 1.5 }}>
                  {path.sub}
                </p>

                <div
                  style={{
                    marginTop: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontWeight: 700,
                    fontSize: 14,
                    color: path.accent,
                  }}
                  className="path-tile-cta"
                >
                  <span>{path.cta}</span>
                  <Icon d={icons.arrow} size={16}/>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Wave divider between Pick-your-path and Featured Tours —
          echo of the logo's underline, ties the home rhythm together. */}
      <div className="container" style={{ paddingTop: 8, paddingBottom: 8 }}>
        <WaveDivider/>
      </div>

      {/* FEATURED TOURS */}
      <section className="container" style={{ paddingTop: 24, paddingBottom: 40 }}>
        <div style={{ display:'flex', alignItems:'baseline', gap: 16, marginBottom: 16 }}>
          <div>
            <h2 className="display" style={{ fontSize: 36, margin: 0 }}>{t.featuredTitle}</h2>
            <WaveMark color="sun" width={96} height={12} strokeWidth={2.6}/>
          </div>
          <div style={{ flex: 1, height: 1, background:'var(--line)' }}/>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('catalog')}>{t.viewAll} <Icon d={icons.arrow} size={14}/></button>
        </div>
        <div className="rg-3" style={{ display:'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {featured.map(tour => (
            <TourCard key={tour.id} tour={tour} onClick={() => navigate('detail', { tourId: tour.id })}/>
          ))}
        </div>
      </section>

      {/* Subtle wave divider — single hairline echo before the map. */}
      <div className="container" style={{ paddingTop: 8, paddingBottom: 8 }}>
        <WaveDivider variant="subtle"/>
      </div>

      {/* MAP */}
      <section className="container" style={{ paddingTop: 24, paddingBottom: 40 }}>
        <div className="rg" style={{ display:'grid', gridTemplateColumns: '1fr 1.6fr', gap: 40, alignItems:'center' }}>
          <div>
            <div className="mono" style={{ color:'var(--ink-soft)', marginBottom: 12 }}>01 / THE REGION</div>
            <h2 className="display" style={{ fontSize: 48, margin: 0, lineHeight: 0.95 }}>
              {lang === 'en' ? <>From Cancún to Chetumal — we <span style={{color:'var(--clay)'}}>cover it.</span></> : <>De Cancún a Chetumal — lo <span style={{color:'var(--clay)'}}>cubrimos.</span></>}
            </h2>
            <p style={{ color:'var(--ink-soft)', fontSize: 16, marginTop: 20, lineHeight: 1.5 }}>
              {lang === 'en'
                ? 'Seven destinations, two airports, one cruise port. Tap a pin to see what\'s there.'
                : 'Siete destinos, dos aeropuertos, un puerto de cruceros. Toca un pin para ver qué hay ahí.'}
            </p>
            <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => navigate('map')}>
              {t.navMap} <Icon d={icons.arrow} size={14}/>
            </button>
          </div>
          <MiniMap onPinClick={(pin) => navigate('map', { focus: pin.id })}/>
        </div>
      </section>

      {/* WHY US */}
      <section style={{ background: 'var(--ink)', color: 'var(--bone)', padding: '80px 0', marginTop: 80 }}>
        <div className="container">
          <div style={{ display:'flex', alignItems:'baseline', gap: 16, marginBottom: 40 }}>
            <h2 className="display" style={{ fontSize: 36, margin: 0 }}>{t.whySection}</h2>
            <div style={{ flex: 1, height: 1, background: 'rgba(245,240,230,0.2)' }}/>
          </div>
          <div className="rg-4" style={{ display:'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {[
              { icon: icons.pin, title: t.whyLocal, sub: t.whyLocalSub },
              { icon: icons.shield, title: t.whyGuarantee, sub: t.whyGuaranteeSub },
              { icon: icons.spark, title: t.whyPrice, sub: t.whyPriceSub },
              { icon: icons.clock, title: t.whyFlex, sub: t.whyFlexSub }
            ].map((w,i) => (
              <div key={i} style={{ borderTop: '1px solid rgba(245,240,230,0.2)', paddingTop: 20 }}>
                <div style={{ width: 40, height: 40, borderRadius:'50%', background: 'var(--sun)', color: 'var(--ink)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom: 16 }}>
                  <Icon d={w.icon} size={18}/>
                </div>
                <h3 className="display" style={{ fontSize: 20, margin: '0 0 8px', color: 'var(--bone)' }}>{w.title}</h3>
                <p style={{ fontSize: 13, color: 'rgba(245,240,230,0.7)', margin: 0, lineHeight: 1.5 }}>{w.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
window.Home = Home;
