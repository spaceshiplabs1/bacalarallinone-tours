// Catalog — filter + sort, full-width responsive card grid
const Catalog = ({ initialFilter }) => {
  const { t, lang, navigate } = useT();
  const [filter, setFilter] = useState(initialFilter || 'all');
  const [portOnly, setPortOnly] = useState(false);
  const [sort, setSort] = useState('popular');
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  // Tracks the live window.TOURS reference so the filtered useMemo below
  // re-runs when data-api.js swaps the placeholder for the real catalog.
  // data-api.js dispatches a `hashchange` event after the swap, which the
  // App-level router already listens to — but the Catalog's useMemo deps
  // don't change, so we need our own signal here. Bumping a counter on
  // hashchange forces the memo to recompute against the new window.TOURS.
  const [toursTick, setToursTick] = useState(0);
  useEffect(() => {
    const onChange = () => setToursTick((n) => n + 1);
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const filters = [
    { k: 'all', label: t.filterAll },
    { k: 'lagoon', label: t.filterLagoon },
    { k: 'ruins', label: t.filterRuins },
    { k: 'adventure', label: t.filterAdventure },
    { k: 'ocean', label: t.filterOcean },
    { k: 'beach', label: t.filterBeach },
    { k: 'transfer', label: t.filterTransfer },
  ];

  const filtered = useMemo(() => {
    // data-api.js seeds window.TOURS with a single "__loading__" placeholder
    // so detail-page deep links don't crash before the catalog fetch resolves.
    // Filter it out here so the catalog never renders the placeholder as a
    // real card (which made auto-fit stretch it across the whole row on
    // first paint).
    let out = window.TOURS.filter(tr => {
      if (tr.id === '__loading__' || tr.slug === '__loading__') return false;
      if (filter !== 'all' && tr.category !== filter) return false;
      if (portOnly && !tr.audience.includes('port')) return false;
      if (query) {
        const q = query.toLowerCase();
        const t1 = tr.title[lang].toLowerCase() + tr.location.toLowerCase() + tr.tags.join(' ');
        if (!t1.includes(q)) return false;
      }
      return true;
    });
    if (sort === 'price') out.sort((a,b) => a.priceAdult - b.priceAdult);
    if (sort === 'duration') out.sort((a,b) => a.duration - b.duration);
    if (sort === 'rating') out.sort((a,b) => b.rating - a.rating);
    if (sort === 'popular') out.sort((a,b) => b.reviews - a.reviews);
    return out;
  }, [filter, portOnly, sort, query, lang, toursTick]);

  // Distinguish "still loading the catalog" from "no results match the
  // current filter" so we don't show the empty-state copy on first paint.
  const stillLoading =
    window.TOURS.length === 1 && window.TOURS[0].id === '__loading__';

  return (
    <div className="fade-in">
      {/* Hero — mirrors the shuttle page: tall, with two backgrounds
          cross-fading every 7s (reuses .transfers-hero-bg keyframes) and
          a dark overlay so the headline stays legible. */}
      <section
        style={{
          color: 'var(--bone)',
          padding: '110px 0 130px',
          position: 'relative',
          overflow: 'hidden',
          background: 'var(--jungle)',
          minHeight: 380,
        }}
      >
        <div
          aria-hidden
          className="catalog-hero-bg catalog-hero-bg--a"
          style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'url(./images/hero-lagoon-1600.webp)',
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
          }}
        />
        <div
          aria-hidden
          className="catalog-hero-bg catalog-hero-bg--b"
          style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'url(./images/cenotes-tour-1600.webp)',
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
          }}
        />
        <div
          aria-hidden
          className="catalog-hero-bg catalog-hero-bg--c"
          style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'url(./images/chichen-itza-1600.webp)',
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute', inset: 0,
            // Horizontal gradient (dark left → transparent right) lets
            // the photo subjects keep their natural light. Slight
            // bottom darken keeps the search bar's overlap legible.
            background:
              'linear-gradient(90deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.30) 35%, rgba(0,0,0,0) 65%),' +
              'linear-gradient(180deg, rgba(0,0,0,0) 65%, rgba(0,0,0,0.32) 100%)',
          }}
        />
        <div className="container" style={{ position: 'relative' }}>
          <div className="mono" style={{ color: 'var(--sun)', marginBottom: 14 }}>
            02 / CATALOG · {filtered.length} {lang==='en'?'experiences':'experiencias'}
          </div>
          <h1 className="display" style={{ fontSize: 'clamp(38px, 5vw, 64px)', margin: 0, lineHeight: 1, maxWidth: 800, textShadow: '0 2px 16px rgba(0,0,0,0.45)' }}>
            {lang==='en' ? <>Tours <span style={{ color: 'var(--sun)' }}>& adventures.</span></> : <>Tours <span style={{ color: 'var(--sun)' }}>y aventuras.</span></>}
          </h1>
          <p style={{ fontSize: 16, opacity: 0.92, marginTop: 14, maxWidth: 620, textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}>
            {lang==='en'
              ? 'Lagoon, ruins, jungle, ocean — handpicked by locals, bookable in two clicks.'
              : 'Laguna, ruinas, selva, mar — escogidos por locales, reservables en dos clics.'}
          </p>
        </div>
      </section>

      {/* Featured search bar overlapping the hero, like the transfers form.
          Constrained max-width + centered so it doesn't run the full page.
          Border + ring shift on focus so the input clearly signals state. */}
      <div className="container" style={{ marginTop: -36, position: 'relative' }}>
        <div
          className="card"
          style={{
            padding: '12px 18px',
            boxShadow: searchFocused
              ? '0 1px 2px rgba(12,42,46,0.06), 0 12px 32px rgba(47,184,201,0.18), 0 0 0 2px var(--lagoon)'
              : 'var(--shadow)',
            maxWidth: 720,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            transition: 'box-shadow 180ms ease, transform 180ms ease',
            transform: searchFocused ? 'translateY(-2px)' : 'translateY(0)',
          }}
        >
          <Icon
            d={icons.search}
            size={20}
            style={{
              color: searchFocused ? 'var(--lagoon-deep)' : 'var(--ink-soft)',
              flexShrink: 0,
              transition: 'color 180ms ease',
            }}
          />
          <input
            placeholder={lang==='en'
              ? 'Search tours — "ruins", "lagoon", "ATV"…'
              : 'Busca tours — "ruinas", "laguna", "ATV"…'}
            value={query}
            onChange={(e)=>setQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 15,
              padding: '14px 0',
              color: 'var(--ink)',
              fontFamily: 'inherit',
            }}
          />
        </div>
      </div>

      <div className="container" style={{ paddingTop: 28, paddingBottom: 40 }}>
        {/* filter bar */}
        <div className="rg-filter-bar" style={{ display:'flex', gap: 10, flexWrap:'wrap', marginBottom: 12, alignItems:'center' }}>
          {filters.map(f => (
            <button key={f.k} className={`chip ${filter === f.k ? 'active' : ''}`} onClick={()=>setFilter(f.k)} style={{ border:'none', cursor:'pointer' }}>
              {f.label}
            </button>
          ))}
          <button className={`chip ${portOnly ? 'sun' : ''}`} onClick={()=>setPortOnly(!portOnly)} style={{ border:'none', cursor:'pointer' }}>
            <Icon d={icons.ship} size={12}/> {t.filterPort}
          </button>
          <div style={{ flex: 1 }}/>
          <select className="select" value={sort} onChange={(e)=>setSort(e.target.value)} style={{ width: 'auto', padding: '8px 14px', fontSize: 13 }}>
            <option value="popular">{t.sortPopular}</option>
            <option value="price">{t.sortPrice}</option>
            <option value="duration">{t.sortDuration}</option>
            <option value="rating">{t.sortRating}</option>
          </select>
        </div>

        <div className="rg-cards" style={{ display:'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 22, marginTop: 20 }}>
          {stillLoading
            ? Array.from({ length: 6 }).map((_, i) => <TourCardSkeleton key={`sk-${i}`}/>)
            : filtered.map(tour => (
                <TourCard key={tour.id} tour={tour} onClick={() => navigate('detail', { tourId: tour.id })}/>
              ))}
          {!stillLoading && filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign:'center', padding: 60, color:'var(--ink-soft)' }}>
              {lang==='en' ? 'No tours match. Try different filters.' : 'No hay tours. Cambia los filtros.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
window.Catalog = Catalog;
