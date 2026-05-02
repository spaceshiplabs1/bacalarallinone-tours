// Catalog — filter + sort, full-width responsive card grid
const Catalog = ({ initialFilter }) => {
  const { t, lang, navigate } = useT();
  const [filter, setFilter] = useState(initialFilter || 'all');
  const [portOnly, setPortOnly] = useState(false);
  const [sort, setSort] = useState('popular');
  const [query, setQuery] = useState('');

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
    let out = window.TOURS.filter(tr => {
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
  }, [filter, portOnly, sort, query, lang]);

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
          className="transfers-hero-bg transfers-hero-bg--a"
          style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'url(./images/hero-lagoon.webp)',
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
          }}
        />
        <div
          aria-hidden
          className="transfers-hero-bg transfers-hero-bg--b"
          style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'url(./images/cenotes-tour.webp)',
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.6) 100%)',
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
          Constrained max-width + centered so it doesn't run the full page. */}
      <div className="container" style={{ marginTop: -32, position: 'relative' }}>
        <div
          className="card"
          style={{
            padding: '10px 16px',
            boxShadow: 'var(--shadow)',
            maxWidth: 640,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Icon d={icons.search} size={18} style={{ color: 'var(--ink-soft)', flexShrink: 0 }}/>
          <input
            placeholder={lang==='en'
              ? 'Search tours — "ruins", "lagoon", "ATV"…'
              : 'Busca tours — "ruinas", "laguna", "ATV"…'}
            value={query}
            onChange={(e)=>setQuery(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 15,
              padding: '12px 0',
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

        <div className="rg-cards" style={{ display:'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 22, marginTop: 20 }}>
          {filtered.map(tour => (
            <TourCard key={tour.id} tour={tour} onClick={() => navigate('detail', { tourId: tour.id })}/>
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign:'center', padding: 60, color:'var(--ink-soft)' }}>
              {lang==='en'?'No tours match. Try different filters.':'No hay tours. Cambia los filtros.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
window.Catalog = Catalog;
