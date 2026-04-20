// Map debug — drag pins over the illustrated territory map, read live coords, copy JSON.
// Route: 'map-debug'. Entry: footer dev link or set route via localStorage.
const MapDebug = () => {
  const { lang, navigate } = useT();
  const [pins, setPins] = useState(() =>
    // deep clone so we don't mutate the global
    JSON.parse(JSON.stringify(window.MAP_PINS))
  );
  const [dragId, setDragId] = useState(null);
  const [copied, setCopied] = useState(false);
  const stageRef = useRef(null);

  const onDown = (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragId(id);
  };

  useEffect(() => {
    if (!dragId) return;
    const move = (e) => {
      if (!stageRef.current) return;
      const rect = stageRef.current.getBoundingClientRect();
      const cx = (e.clientX || (e.touches && e.touches[0]?.clientX)) - rect.left;
      const cy = (e.clientY || (e.touches && e.touches[0]?.clientY)) - rect.top;
      const x = Math.max(0, Math.min(100, (cx / rect.width) * 100));
      const y = Math.max(0, Math.min(100, (cy / rect.height) * 100));
      setPins(p => p.map(pin => pin.id === dragId ? { ...pin, x: +x.toFixed(2), y: +y.toFixed(2) } : pin));
    };
    const up = () => setDragId(null);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
    };
  }, [dragId]);

  const jsonOut = 'window.MAP_PINS = ' + JSON.stringify(pins, null, 2) + ';';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(jsonOut);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const reset = () => setPins(JSON.parse(JSON.stringify(window.MAP_PINS)));

  return (
    <div className="container fade-in" style={{ paddingTop: 24, paddingBottom: 40 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap: 16, marginBottom: 18 }}>
        <div>
          <div className="mono" style={{ color:'var(--ink-soft)' }}>DEV / MAP PIN DEBUG</div>
          <h1 className="display" style={{ fontSize: 40, margin: '4px 0 0', lineHeight: 1 }}>
            Drag pins. <span style={{ color:'var(--clay)' }}>Copy JSON.</span>
          </h1>
          <p style={{ color:'var(--ink-soft)', marginTop: 6, fontSize: 14 }}>
            Coordinates are percentages of the map box (0–100). Drop the pins exactly over each town on the illustrated map, then hit Copy.
          </p>
        </div>
        <div style={{ display:'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={reset}>Reset</button>
          <button className="btn btn-outline btn-sm" onClick={()=>navigate('map')}>Back to map</button>
        </div>
      </div>

      <div className="rg" style={{ display:'grid', gridTemplateColumns: '1.6fr 1fr', gap: 24, alignItems:'flex-start' }}>
        {/* Stage */}
        <div>
          <div
            ref={stageRef}
            style={{
              position:'relative', width:'100%', aspectRatio:'4 / 3',
              borderRadius:'var(--radius-lg)', overflow:'hidden',
              background:'var(--bone-2)', border:'1px solid var(--line)',
              userSelect:'none', cursor: dragId ? 'grabbing' : 'default'
            }}>
            <img src="./images/territory-map-1600.webp" alt="" draggable={false}
              style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', pointerEvents:'none' }}/>
            {/* crosshair rulers when dragging */}
            {dragId && (() => {
              const p = pins.find(x => x.id === dragId);
              if (!p) return null;
              return (
                <>
                  <div style={{ position:'absolute', left:0, right:0, top:`${p.y}%`, borderTop:'1px dashed rgba(12,42,46,0.5)', pointerEvents:'none' }}/>
                  <div style={{ position:'absolute', top:0, bottom:0, left:`${p.x}%`, borderLeft:'1px dashed rgba(12,42,46,0.5)', pointerEvents:'none' }}/>
                </>
              );
            })()}

            {pins.map(pin => {
              const active = dragId === pin.id;
              const haloSize = active ? 32 : 22;
              return (
                <div key={pin.id}
                  onMouseDown={(e)=>onDown(pin.id, e)}
                  onTouchStart={(e)=>onDown(pin.id, e)}
                  style={{
                    position:'absolute', left:`${pin.x}%`, top:`${pin.y}%`,
                    transform:'translate(-50%, -50%)',
                    cursor: active ? 'grabbing' : 'grab',
                    width: 16, height: 16,
                    touchAction:'none'
                  }}>
                  <div style={{
                    position:'absolute', left:'50%', top:'50%', width: haloSize, height: haloSize,
                    transform:'translate(-50%, -50%)',
                    borderRadius:'50%', background:'var(--clay)', opacity: 0.4,
                    pointerEvents:'none'
                  }}/>
                  <div style={{
                    position:'absolute', left:'50%', top:'50%', width: 14, height: 14,
                    transform:'translate(-50%, -50%)',
                    borderRadius:'50%',
                    background: active ? 'var(--sun)' : 'var(--clay)',
                    border:'2.5px solid var(--bone)', boxShadow:'0 2px 6px rgba(0,0,0,0.4)',
                    zIndex: 1, pointerEvents:'none'
                  }}/>
                  <span className="mono" style={{
                    position:'absolute', left:'50%', top:'calc(100% + 6px)', transform:'translateX(-50%)',
                    background:'var(--bone)', padding:'2px 6px', borderRadius:4,
                    fontSize: 9, boxShadow:'0 1px 2px rgba(0,0,0,0.1)', whiteSpace:'nowrap',
                    color:'var(--ink)', pointerEvents:'none'
                  }}>
                    {pin.name} · {pin.x.toFixed(1)},{pin.y.toFixed(1)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mono" style={{ color:'var(--ink-soft)', marginTop: 10, fontSize: 11 }}>
            TIP: drag the center of the dot, release anywhere. Coordinates update live.
          </div>
        </div>

        {/* Output */}
        <div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 10 }}>
              <div className="mono" style={{ color:'var(--ink-soft)' }}>OUTPUT · paste into data.js</div>
              <button className="btn btn-sun btn-sm" onClick={copy}>
                {copied ? '✓ Copied' : 'Copy JSON'}
              </button>
            </div>
            <pre style={{
              margin: 0, fontFamily:'JetBrains Mono, monospace', fontSize: 11,
              lineHeight: 1.5, background:'var(--ink)', color:'var(--bone)',
              padding: 14, borderRadius: 8, overflow:'auto', maxHeight: 440, whiteSpace:'pre'
            }}>{jsonOut}</pre>
          </div>

          <div className="card" style={{ padding: 14, marginTop: 12 }}>
            <div className="mono" style={{ color:'var(--ink-soft)', marginBottom: 8 }}>PINS</div>
            <div style={{ display:'flex', flexDirection:'column', gap: 6, fontSize: 12 }}>
              {pins.map(p => (
                <div key={p.id} style={{ display:'flex', justifyContent:'space-between', gap: 10, padding:'4px 0', borderBottom:'1px dashed var(--line)' }}>
                  <span style={{ fontWeight: 500 }}>{p.name}</span>
                  <span className="mono" style={{ color:'var(--ink-soft)' }}>x:{p.x.toFixed(2)} · y:{p.y.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
window.MapDebug = MapDebug;
