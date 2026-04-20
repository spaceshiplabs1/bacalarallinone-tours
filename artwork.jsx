// SVG mockup illustrations — used in place of photo placeholders
window.Artwork = {
  lagoon: (label) => (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" style={{ position:'absolute', inset: 0, width:'100%', height:'100%' }}>
      <defs>
        <linearGradient id="lagSky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#f6e6c4"/>
          <stop offset="60%" stopColor="#b8e8ee"/>
          <stop offset="100%" stopColor="#4ec4d4"/>
        </linearGradient>
        <linearGradient id="lagWater" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#2fb8c9"/>
          <stop offset="50%" stopColor="#1a6d7a"/>
          <stop offset="100%" stopColor="#0c3a42"/>
        </linearGradient>
      </defs>
      <rect width="400" height="180" fill="url(#lagSky)"/>
      <rect y="180" width="400" height="120" fill="url(#lagWater)"/>
      {/* sun */}
      <circle cx="320" cy="90" r="34" fill="#f4c95d" opacity="0.9"/>
      <circle cx="320" cy="90" r="50" fill="#f4c95d" opacity="0.25"/>
      {/* distant island */}
      <path d="M0,180 Q80,155 150,170 Q220,160 400,175 L400,180 Z" fill="#1f4a2e" opacity="0.7"/>
      {/* water bands (7 colors) */}
      <rect x="0" y="190" width="400" height="4" fill="#b8e8ee" opacity="0.5"/>
      <rect x="0" y="200" width="400" height="3" fill="#4ec4d4" opacity="0.4"/>
      <rect x="0" y="215" width="400" height="3" fill="#2fb8c9" opacity="0.3"/>
      {/* sailboat */}
      <g transform="translate(120,155)">
        <path d="M0,40 L30,10 L30,40 Z" fill="#f5f0e6"/>
        <path d="M30,10 L30,40 L60,40 Z" fill="#ece5d5"/>
        <rect x="-5" y="40" width="70" height="6" fill="#2a1810" rx="2"/>
        <line x1="30" y1="10" x2="30" y2="46" stroke="#2a1810" strokeWidth="1.5"/>
      </g>
      {/* reflection ripples */}
      <ellipse cx="150" cy="215" rx="80" ry="3" fill="#f5f0e6" opacity="0.2"/>
      {label && <text x="200" y="285" fontFamily="JetBrains Mono" fontSize="9" fill="#f5f0e6" textAnchor="middle" letterSpacing="1.5" opacity="0.7">{label}</text>}
    </svg>
  ),
  ruins: (label) => (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" style={{ position:'absolute', inset: 0, width:'100%', height:'100%' }}>
      <defs>
        <linearGradient id="ruinsSky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#e89a3c"/>
          <stop offset="60%" stopColor="#d4722a"/>
          <stop offset="100%" stopColor="#8b3a2a"/>
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#ruinsSky)"/>
      {/* jungle silhouette */}
      <path d="M0,220 Q30,190 60,210 Q100,180 140,205 Q180,175 220,200 Q260,170 300,195 Q340,180 400,200 L400,300 L0,300 Z" fill="#1f4a2e" opacity="0.9"/>
      {/* pyramid */}
      <g transform="translate(140,110)">
        <polygon points="60,0 0,140 120,140" fill="#8b6a3a"/>
        <polygon points="60,0 0,140 120,140" fill="#5a3f22" fillOpacity="0.3"/>
        {/* steps */}
        {[20,40,60,80,100,120].map((y,i) => (
          <rect key={i} x={5 + i*4} y={y} width={110 - i*8} height="3" fill="#2a1810" opacity="0.35"/>
        ))}
        {/* center stairway */}
        <rect x="54" y="20" width="12" height="120" fill="#5a3f22"/>
        <rect x="50" y="118" width="20" height="22" fill="#2a1810"/>
      </g>
      {/* sun disk */}
      <circle cx="80" cy="60" r="22" fill="#f4c95d"/>
      {/* glyph */}
      <g transform="translate(40,40)" fill="#2a1810" opacity="0.5">
        <rect width="16" height="2"/>
        <rect y="6" width="12" height="2"/>
        <rect y="12" width="16" height="2"/>
      </g>
      {label && <text x="200" y="285" fontFamily="JetBrains Mono" fontSize="9" fill="#f5f0e6" textAnchor="middle" letterSpacing="1.5" opacity="0.7">{label}</text>}
    </svg>
  ),
  jungle: (label) => (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" style={{ position:'absolute', inset: 0, width:'100%', height:'100%' }}>
      <defs>
        <linearGradient id="jgBg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#2d6b41"/>
          <stop offset="100%" stopColor="#0c3a1a"/>
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#jgBg)"/>
      {/* light rays */}
      <path d="M100,0 L140,300 L60,300 Z" fill="#f4c95d" opacity="0.08"/>
      <path d="M250,0 L280,300 L220,300 Z" fill="#f4c95d" opacity="0.06"/>
      {/* cenote pool */}
      <ellipse cx="200" cy="230" rx="130" ry="30" fill="#2fb8c9"/>
      <ellipse cx="200" cy="225" rx="110" ry="22" fill="#b8e8ee"/>
      <ellipse cx="200" cy="225" rx="110" ry="22" fill="#2fb8c9" opacity="0.4"/>
      {/* palms */}
      {[30, 360].map((x,i) => (
        <g key={i} transform={`translate(${x},180)`}>
          <rect x="-3" y="0" width="6" height="90" fill="#2a1810"/>
          <path d="M0,0 Q-40,-20 -60,-10" stroke="#1f4a2e" strokeWidth="4" fill="none" strokeLinecap="round"/>
          <path d="M0,0 Q40,-20 60,-10" stroke="#1f4a2e" strokeWidth="4" fill="none" strokeLinecap="round"/>
          <path d="M0,0 Q-20,-40 -30,-55" stroke="#2d6b41" strokeWidth="4" fill="none" strokeLinecap="round"/>
          <path d="M0,0 Q20,-40 30,-55" stroke="#2d6b41" strokeWidth="4" fill="none" strokeLinecap="round"/>
          <path d="M0,0 Q0,-50 5,-70" stroke="#2d6b41" strokeWidth="4" fill="none" strokeLinecap="round"/>
        </g>
      ))}
      {/* monstera leaves */}
      <g transform="translate(80,50) rotate(-20)" fill="#1f4a2e" opacity="0.7">
        <path d="M0,0 Q30,-10 40,-30 Q30,-50 0,-55 Q-30,-50 -40,-30 Q-30,-10 0,0 Z"/>
        <path d="M5,-20 L5,-55" stroke="#0c3a1a" strokeWidth="1.5" fill="none"/>
      </g>
      <g transform="translate(330,80) rotate(20)" fill="#2d6b41" opacity="0.8">
        <ellipse cx="0" cy="0" rx="25" ry="40"/>
      </g>
      {label && <text x="200" y="285" fontFamily="JetBrains Mono" fontSize="9" fill="#f5f0e6" textAnchor="middle" letterSpacing="1.5" opacity="0.8">{label}</text>}
    </svg>
  ),
  reef: (label) => (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" style={{ position:'absolute', inset: 0, width:'100%', height:'100%' }}>
      <defs>
        <linearGradient id="reefBg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#4ec4d4"/>
          <stop offset="100%" stopColor="#0c3a42"/>
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#reefBg)"/>
      {/* light caustics */}
      <path d="M0,0 Q100,30 200,20 Q300,40 400,10 L400,0 Z" fill="#b8e8ee" opacity="0.3"/>
      <path d="M50,60 Q150,70 250,50" stroke="#b8e8ee" strokeWidth="1" fill="none" opacity="0.4"/>
      <path d="M20,100 Q120,110 220,90" stroke="#b8e8ee" strokeWidth="1" fill="none" opacity="0.3"/>
      {/* coral */}
      <g transform="translate(60,220)">
        <ellipse cx="0" cy="20" rx="30" ry="10" fill="#b35a3c"/>
        <circle cx="-10" cy="10" r="8" fill="#e89a3c"/>
        <circle cx="5" cy="8" r="10" fill="#d4722a"/>
        <circle cx="15" cy="12" r="7" fill="#b35a3c"/>
      </g>
      <g transform="translate(320,225)">
        <ellipse cx="0" cy="15" rx="40" ry="12" fill="#5a3f22"/>
        <path d="M-20,15 Q-25,-5 -15,-15 Q-5,-10 -10,15" fill="#e89a3c"/>
        <path d="M5,15 Q10,-10 20,-5 Q25,10 15,15" fill="#d4722a"/>
      </g>
      {/* fish */}
      <g transform="translate(180,120)">
        <path d="M0,0 Q15,-8 30,0 Q15,8 0,0 Z" fill="#f4c95d"/>
        <path d="M0,0 L-8,-6 L-8,6 Z" fill="#f4c95d"/>
        <circle cx="22" cy="-2" r="1.5" fill="#2a1810"/>
      </g>
      <g transform="translate(240,170)">
        <path d="M0,0 Q12,-6 24,0 Q12,6 0,0 Z" fill="#e89a3c"/>
        <path d="M0,0 L-6,-5 L-6,5 Z" fill="#e89a3c"/>
      </g>
      <g transform="translate(100,150)">
        <path d="M0,0 Q10,-5 20,0 Q10,5 0,0 Z" fill="#f5f0e6"/>
        <path d="M0,0 L-5,-4 L-5,4 Z" fill="#f5f0e6"/>
      </g>
      {/* bubbles */}
      <circle cx="150" cy="80" r="3" fill="#b8e8ee" opacity="0.7"/>
      <circle cx="160" cy="60" r="2" fill="#b8e8ee" opacity="0.6"/>
      <circle cx="280" cy="90" r="4" fill="#b8e8ee" opacity="0.7"/>
      {label && <text x="200" y="285" fontFamily="JetBrains Mono" fontSize="9" fill="#f5f0e6" textAnchor="middle" letterSpacing="1.5" opacity="0.8">{label}</text>}
    </svg>
  ),
  beach: (label) => (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" style={{ position:'absolute', inset: 0, width:'100%', height:'100%' }}>
      <defs>
        <linearGradient id="bchSky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#f6e6c4"/>
          <stop offset="100%" stopColor="#b8e8ee"/>
        </linearGradient>
      </defs>
      <rect width="400" height="180" fill="url(#bchSky)"/>
      <rect y="180" width="400" height="50" fill="#2fb8c9"/>
      <rect y="230" width="400" height="70" fill="#f4e1b5"/>
      <circle cx="310" cy="90" r="30" fill="#f4c95d"/>
      {/* sea foam */}
      <path d="M0,225 Q100,220 200,228 Q300,222 400,228 L400,232 L0,232 Z" fill="#f5f0e6" opacity="0.8"/>
      {/* palm */}
      <g transform="translate(70,240)">
        <path d="M0,0 Q5,-40 15,-80" stroke="#2a1810" strokeWidth="6" fill="none" strokeLinecap="round"/>
        <g transform="translate(15,-80)">
          <path d="M0,0 Q-40,-15 -60,-5" stroke="#1f4a2e" strokeWidth="5" fill="none" strokeLinecap="round"/>
          <path d="M0,0 Q40,-15 60,-5" stroke="#1f4a2e" strokeWidth="5" fill="none" strokeLinecap="round"/>
          <path d="M0,0 Q-20,-35 -30,-50" stroke="#2d6b41" strokeWidth="5" fill="none" strokeLinecap="round"/>
          <path d="M0,0 Q20,-35 30,-50" stroke="#2d6b41" strokeWidth="5" fill="none" strokeLinecap="round"/>
          <path d="M0,0 Q0,-40 5,-55" stroke="#2d6b41" strokeWidth="5" fill="none" strokeLinecap="round"/>
        </g>
      </g>
      {/* umbrella */}
      <g transform="translate(280,250)">
        <rect x="-1" y="0" width="2" height="40" fill="#2a1810"/>
        <path d="M-40,0 Q0,-30 40,0 Z" fill="#b35a3c"/>
        <path d="M-40,0 Q0,-30 40,0" stroke="#8b3a2a" strokeWidth="1" fill="none"/>
        <line x1="-20" y1="-15" x2="-20" y2="0" stroke="#8b3a2a" strokeWidth="0.5"/>
        <line x1="0" y1="-30" x2="0" y2="0" stroke="#8b3a2a" strokeWidth="0.5"/>
        <line x1="20" y1="-15" x2="20" y2="0" stroke="#8b3a2a" strokeWidth="0.5"/>
      </g>
      {/* beach bed */}
      <rect x="230" y="270" width="80" height="6" fill="#f5f0e6" rx="2"/>
      {label && <text x="200" y="290" fontFamily="JetBrains Mono" fontSize="9" fill="#2a1810" textAnchor="middle" letterSpacing="1.5" opacity="0.7">{label}</text>}
    </svg>
  ),
  atv: (label) => (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" style={{ position:'absolute', inset: 0, width:'100%', height:'100%' }}>
      <defs>
        <linearGradient id="atvBg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#e89a3c"/>
          <stop offset="60%" stopColor="#d4722a"/>
          <stop offset="100%" stopColor="#5a3f22"/>
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#atvBg)"/>
      {/* jungle silhouette */}
      <path d="M0,180 Q50,150 100,170 Q160,140 220,165 Q280,135 340,160 Q380,150 400,165 L400,300 L0,300 Z" fill="#1f4a2e"/>
      {/* dust cloud */}
      <ellipse cx="140" cy="220" rx="60" ry="18" fill="#f4e1b5" opacity="0.5"/>
      <ellipse cx="110" cy="215" rx="40" ry="14" fill="#f4e1b5" opacity="0.4"/>
      {/* ATV */}
      <g transform="translate(180,200)">
        <rect x="-30" y="-15" width="60" height="25" fill="#2a1810" rx="4"/>
        <rect x="-25" y="-25" width="50" height="12" fill="#b35a3c" rx="2"/>
        <circle cx="-25" cy="20" r="16" fill="#2a1810"/>
        <circle cx="-25" cy="20" r="8" fill="#5a3f22"/>
        <circle cx="25" cy="20" r="16" fill="#2a1810"/>
        <circle cx="25" cy="20" r="8" fill="#5a3f22"/>
        {/* rider */}
        <circle cx="0" cy="-30" r="8" fill="#f5f0e6"/>
        <path d="M-8,-38 Q0,-45 8,-38" stroke="#2a1810" strokeWidth="2" fill="none"/>
      </g>
      {label && <text x="200" y="285" fontFamily="JetBrains Mono" fontSize="9" fill="#f5f0e6" textAnchor="middle" letterSpacing="1.5" opacity="0.9">{label}</text>}
    </svg>
  ),
  van: (label) => (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" style={{ position:'absolute', inset: 0, width:'100%', height:'100%' }}>
      <defs>
        <linearGradient id="vanBg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#2d6b41"/>
          <stop offset="100%" stopColor="#0c2a2e"/>
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#vanBg)"/>
      {/* road */}
      <path d="M0,230 L400,230 L400,300 L0,300 Z" fill="#2a1810"/>
      {[40,120,200,280,360].map((x,i)=>(
        <rect key={i} x={x} y="263" width="24" height="4" fill="#f4c95d"/>
      ))}
      {/* jungle walls */}
      <path d="M0,120 Q50,80 100,120 L100,230 L0,230 Z" fill="#1f4a2e"/>
      <path d="M400,120 Q350,80 300,120 L300,230 L400,230 Z" fill="#1f4a2e"/>
      {/* van */}
      <g transform="translate(200,175)">
        <rect x="-55" y="-30" width="110" height="50" fill="#f5f0e6" rx="6"/>
        <rect x="-55" y="-30" width="40" height="50" fill="#2fb8c9" rx="6"/>
        <rect x="-10" y="-22" width="20" height="18" fill="#b8e8ee"/>
        <rect x="15" y="-22" width="20" height="18" fill="#b8e8ee"/>
        <rect x="-50" y="-22" width="30" height="18" fill="#b8e8ee" rx="2"/>
        <circle cx="-30" cy="22" r="10" fill="#2a1810"/>
        <circle cx="-30" cy="22" r="5" fill="#5a3f22"/>
        <circle cx="30" cy="22" r="10" fill="#2a1810"/>
        <circle cx="30" cy="22" r="5" fill="#5a3f22"/>
        <rect x="45" y="-5" width="10" height="6" fill="#f4c95d"/>
      </g>
      {/* moon/sun */}
      <circle cx="330" cy="70" r="22" fill="#f4c95d" opacity="0.8"/>
      {label && <text x="200" y="285" fontFamily="JetBrains Mono" fontSize="9" fill="#f5f0e6" textAnchor="middle" letterSpacing="1.5" opacity="0.85">{label}</text>}
    </svg>
  )
};

// Maps tour.color slot to an artwork variant
window.artworkFor = (tour) => {
  const byId = {
    'sailboat-bacalar': 'lagoon',
    'pontoon-rapids': 'lagoon',
    'kayak-sunrise': 'lagoon',
    'cenotes-tour': 'jungle',
    'chacchoben-port': 'ruins',
    'kohunlich': 'ruins',
    'tulum-day': 'ruins',
    'chichen-itza': 'ruins',
    'mahahual-beach-club': 'beach',
    'atv-jungle': 'atv',
    'snorkel-reef': 'reef',
    'transfer-cun': 'van',
    'transfer-tulum': 'van'
  };
  return byId[tour.id] || 'lagoon';
};

// Placeholder replacement — render Artwork SVG plus a bottom-aligned mono caption
window.PH = ({ kind, label, children, style, className }) => {
  const Art = window.Artwork[kind] || window.Artwork.lagoon;
  return (
    <div className={`ph-art ${className||''}`} style={{ position:'relative', overflow:'hidden', ...style }}>
      {Art(null)}
      {label && <span className="ph-label" style={{ position:'absolute', left: 12, bottom: 12 }}>{label}</span>}
      {children}
    </div>
  );
};
