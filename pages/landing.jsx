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
        title={frontmatter.metaTitle || frontmatter.title}
        description={frontmatter.metaDescription || ''}
        image={frontmatter.hero}
        type="article"
        alternates={_alternates}
        jsonLd={_seoJsonLd}
      />

      {/* Breadcrumb — Home → Guías/Guides → landing title. */}
      <div className="container">
        <window.Breadcrumbs
          items={[
            { label: lang === 'es' ? 'Inicio' : 'Home', page: 'home' },
            { label: lang === 'es' ? 'Guías' : 'Guides' },
            { label: frontmatter.title }
          ]}
        />
      </div>

      {/* Hero */}
      <section
        className="landing-hero"
        style={{
          position: 'relative',
          minHeight: 480,
          background: '#0c1a2a',
          overflow: 'hidden',
          marginBottom: 40
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
            background: 'linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.65) 100%)'
          }}
        />
        <div className="container" style={{ position: 'relative', zIndex: 1, padding: '110px 0 70px', color: '#fff' }}>
          {frontmatter.kicker && (
            <div className="mono" style={{ fontSize: 12, letterSpacing: '0.18em', opacity: 0.85, textTransform: 'uppercase', marginBottom: 16 }}>
              {frontmatter.kicker}
            </div>
          )}
          <h1
            className="display"
            style={{
              fontSize: 'clamp(36px, 6vw, 60px)',
              lineHeight: 1.05,
              maxWidth: 880,
              margin: 0,
              letterSpacing: '-0.01em'
            }}
          >
            {frontmatter.title}
          </h1>
          {frontmatter.subtitle && (
            <p style={{
              fontSize: 'clamp(17px, 2vw, 21px)',
              lineHeight: 1.45,
              marginTop: 18,
              maxWidth: 760,
              opacity: 0.94
            }}>
              {frontmatter.subtitle}
            </p>
          )}
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
              return <window.TourCardHorizontal key={'tour-' + i} tour={tour}/>;
            }
            if (seg.kind === 'map') return renderMap(seg, 'map-' + i);
            if (seg.kind === 'quote') return renderQuote(seg, 'quote-' + i);
            return null;
          })}
        </div>
      </article>
    </div>
  );
};
window.Landing = Landing;
