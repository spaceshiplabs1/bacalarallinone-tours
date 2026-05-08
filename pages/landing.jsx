// Editorial landing page. Loads /landings/{locale}/{slug}.md, splits the body
// on inline markers ({{tour:slug}}, {{map:lat,lng,zoom}}, {{quote:author|text}})
// and renders alternating prose chunks + React widgets so tours sit *inside*
// the article, not dumped at the end.
const Landing = ({ slug, locale }) => {
  const { lang, navigate } = useT();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  // Tours arrive async via data-api; bump a tick on popstate so resolveTours
  // re-runs once the catalog populates.
  const [, setToursTick] = useState(0);
  useEffect(() => {
    const onChange = () => setToursTick((n) => n + 1);
    window.addEventListener('popstate', onChange);
    return () => window.removeEventListener('popstate', onChange);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    window.tagcLandings.loadLanding(locale || 'es', slug).then((result) => {
      if (cancelled) return;
      setData(result);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [slug, locale]);

  // Click-delegate so markdown links to /tour/<slug>, /guia/<slug>, /guide/<slug>
  // and / route through the SPA without a full reload.
  const onArticleClick = useCallback((e) => {
    const a = e.target.closest && e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || !href.startsWith('/')) return; // external or fragment
    e.preventDefault();
    window.history.pushState(null, '', href);
    window.dispatchEvent(new Event('popstate'));
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center', color: 'var(--ink-soft)' }}>
        <div className="mono">Loading…</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <h1 className="display" style={{ fontSize: 36, marginBottom: 16 }}>
          {lang === 'es' ? 'No encontrado' : 'Not found'}
        </h1>
        <p style={{ color: 'var(--ink-soft)', marginBottom: 24 }}>
          {lang === 'es'
            ? 'La guía que buscas no existe o fue movida.'
            : 'The guide you are looking for does not exist or was moved.'}
        </p>
        <button className="btn btn-primary" onClick={() => navigate('home')}>
          {lang === 'es' ? 'Volver al inicio' : 'Back to home'}
        </button>
      </div>
    );
  }

  const { frontmatter, body } = data;
  const segments = window.tagcLandings.splitBody(body);
  const TOURS = window.TOURS || [];
  const tourBySlug = {};
  TOURS.forEach((t) => { if (t && t.slug) tourBySlug[t.slug] = t; });

  // Tours referenced inline via {{tour:slug}} — used to (a) feed the poker
  // stack with non-overlapping fillers and (b) decide what to show in the
  // end-of-article "more tours" rail.
  const inlineSlugs = new Set();
  segments.forEach((s) => { if (s.kind === 'tour' && s.slug) inlineSlugs.add(s.slug); });

  const pickStackFillers = (primarySlug, n) => {
    const pool = TOURS.filter((t) => t && t.slug && t.slug !== primarySlug);
    return pool.slice(0, n);
  };

  const moreTours = TOURS
    .filter((t) => t && t.slug && !inlineSlugs.has(t.slug))
    .slice(0, 6);

  // SEO — Article + breadcrumb + alternates pointing to the other locale.
  const _seoCtx = window.tagcSchema.ctxFor(
    { page: 'landing', params: { slug, locale } },
    frontmatter.hero
  );
  const _altSlug = frontmatter.alternateSlug || null;
  const _altLocale = locale === 'es' ? 'en' : 'es';
  const _altUrl = _altSlug
    ? window.SEO_SITE.origin
        + window.routeToPath({ page: 'landing', params: { slug: _altSlug, locale: _altLocale } })
    : null;
  const _alternates = {};
  _alternates[locale] = _seoCtx.url;
  if (_altUrl) _alternates[_altLocale] = _altUrl;

  const _seoJsonLd = [
    window.tagcSchema.articleLd({
      title: frontmatter.title,
      description: frontmatter.metaDescription || '',
      publishedAt: frontmatter.publishedAt,
      updatedAt: frontmatter.updatedAt
    }, locale, _seoCtx),
    window.tagcSchema.breadcrumbLd([
      { name: lang === 'es' ? 'Inicio' : 'Home', url: window.SEO_SITE.origin + '/' },
      { name: frontmatter.title, url: _seoCtx.url }
    ])
  ].filter(Boolean);

  const renderProse = (md, key, withDropCap) => (
    <div
      key={key}
      onClick={onArticleClick}
      className={'landing-prose' + (withDropCap ? ' has-dropcap' : '')}
      dangerouslySetInnerHTML={{ __html: window.tagcLandings.renderBody(md) }}
    />
  );

  const renderMap = (seg, key) => {
    const apiKey = window.GOOGLE_MAPS_API_KEY;
    if (!apiKey) return null;
    const src = 'https://maps.googleapis.com/maps/api/staticmap'
      + '?center=' + seg.lat + ',' + seg.lng
      + '&zoom=' + seg.zoom
      + '&size=720x340&scale=2&maptype=terrain'
      + '&markers=color:0xc4651e%7C' + seg.lat + ',' + seg.lng
      + '&key=' + apiKey;
    return (
      <figure key={key} className="landing-map">
        <img src={src} alt="" loading="lazy" style={{ width: '100%', display: 'block', borderRadius: 14 }}/>
      </figure>
    );
  };

  const renderQuote = (seg, key) => (
    <blockquote key={key} className="landing-pullquote">
      <p>{seg.text}</p>
      {seg.author && <cite>— {seg.author}</cite>}
    </blockquote>
  );

  let firstProseSeen = false;

  return (
    <div className="fade-in landing">
      <window.PageSeo
        title={frontmatter.metaTitle || frontmatter.titlePlain || frontmatter.title.replace(/<[^>]+>/g, '')}
        description={frontmatter.metaDescription || ''}
        image={frontmatter.hero}
        type="article"
        alternates={_alternates}
        jsonLd={_seoJsonLd}
      />

      {/* Hero — full-bleed, ~88vh. Breadcrumb sits at the top inside the hero
          so it reads on the image (white text), not on the page bone bg. */}
      <section
        className="landing-hero"
        style={{
          position: 'relative',
          minHeight: 'min(88vh, 820px)',
          background: '#0c1a2a',
          overflow: 'hidden',
          marginBottom: 56,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {frontmatter.hero && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${frontmatter.hero})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
        )}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.30) 45%, rgba(0,0,0,0.78) 100%)'
          }}
        />
        {/* Breadcrumb at top — over the image, white text. */}
        <div
          className="container"
          style={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            padding: '20px 0 0'
          }}
        >
          <div style={{ maxWidth: 880, margin: '0 auto' }}>
            <window.Breadcrumbs
              light
              items={[
                { label: lang === 'es' ? 'Inicio' : 'Home', page: 'home' },
                { label: lang === 'es' ? 'Guías' : 'Guides' },
                { label: frontmatter.titlePlain || frontmatter.title.replace(/<[^>]+>/g, '') }
              ]}
            />
          </div>
        </div>

        {/* Title block at the bottom of the hero. */}
        <div
          className="container"
          style={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            marginTop: 'auto',
            padding: '0 0 80px',
            color: '#fff'
          }}
        >
          <div style={{ maxWidth: 880, margin: '0 auto' }}>
            {frontmatter.kicker && (
              <div
                className="mono"
                style={{
                  fontSize: 12,
                  letterSpacing: '0.22em',
                  opacity: 0.95,
                  textTransform: 'uppercase',
                  marginBottom: 22,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10
                }}
              >
                <span aria-hidden style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--sun)', display: 'inline-block' }}/>
                {frontmatter.kicker}
              </div>
            )}
            <h1
              className="display"
              style={{
                fontSize: 'clamp(40px, 6.4vw, 72px)',
                lineHeight: 1.02,
                margin: 0,
                letterSpacing: '-0.022em',
                fontWeight: 700
              }}
              dangerouslySetInnerHTML={{ __html: frontmatter.title }}
            />
            {frontmatter.flourish && (
              <div
                className="script"
                style={{
                  fontSize: 'clamp(26px, 3vw, 36px)',
                  color: 'var(--sun)',
                  marginTop: 16,
                  letterSpacing: '0.005em'
                }}
              >
                {frontmatter.flourish}
              </div>
            )}
            {frontmatter.subtitle && (
              <p style={{
                fontSize: 'clamp(18px, 1.9vw, 22px)',
                lineHeight: 1.5,
                marginTop: 22,
                maxWidth: 720,
                opacity: 0.96,
                fontFamily: "'Lora', Georgia, serif",
                fontStyle: 'italic'
              }}>
                {frontmatter.subtitle}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Article */}
      <article className="landing-article container" style={{ paddingBottom: 80 }}>
        <div className="landing-column">
          {segments.map((seg, i) => {
            if (seg.kind === 'md') {
              const withDropCap = !firstProseSeen;
              firstProseSeen = true;
              return renderProse(seg.text, 'md-' + i, withDropCap);
            }
            if (seg.kind === 'tour') {
              const tour = tourBySlug[seg.slug];
              if (!tour) return null;
              const fillers = pickStackFillers(seg.slug, 2);
              return <window.TourCardStack key={'tour-' + i} tours={[tour, ...fillers]}/>;
            }
            if (seg.kind === 'map') return renderMap(seg, 'map-' + i);
            if (seg.kind === 'quote') return renderQuote(seg, 'quote-' + i);
            return null;
          })}
          {moreTours.length > 0 && (
            <window.MoreTours tours={moreTours.slice(0, 3)} lang={lang}/>
          )}
        </div>
      </article>
    </div>
  );
};
window.Landing = Landing;
