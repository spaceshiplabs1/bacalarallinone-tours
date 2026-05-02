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
    <div className="container fade-in" style={{ paddingTop: 32, paddingBottom: 40 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom: 28, gap: 20, flexWrap:'wrap' }}>
        <div>
          <div className="mono" style={{ color:'var(--ink-soft)', marginBottom: 8 }}>02 / CATALOG · {filtered.length} {lang==='en'?'results':'resultados'}</div>
          <h1 className="display" style={{ fontSize: 56, margin: 0, lineHeight: 1, display:'flex', flexDirection:'column', gap: 2 }}>
            <span>{t.navTours}</span>
            <span style={{ color: 'var(--clay)', fontSize: '0.5em', lineHeight: 1, fontWeight: 600 }}>& adventures</span>
          </h1>
        </div>
        <div style={{ position:'relative', minWidth: 300 }}>
          <Icon d={icons.search} size={16} style={{ position:'absolute', left: 12, top: 14, color:'var(--ink-soft)' }}/>
          <input className="input" placeholder={t.search} value={query} onChange={(e)=>setQuery(e.target.value)} style={{ paddingLeft: 38 }}/>
        </div>
      </div>

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

      <div className="rg-cards" style={{ display:'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20, marginTop: 28 }}>
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
  );
};
window.Catalog = Catalog;
