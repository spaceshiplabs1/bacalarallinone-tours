// Photography map — locally generated via scripts/generate-image.mjs (Gemini 3.1 Flash Image)
// Masters live in /images as .webp. Use -800 / -1600 suffixes for derived sizes.
// Bump IMG_V whenever you re-run gen:image so browsers drop cached copies.
const IMG_V = '3';
const L = (key, size) => `./images/${key}${size ? `-${size}` : ""}.webp?v=${IMG_V}`;
window.PHOTOS = {
  lagoon:     L("hero-lagoon", "1600"),
  lagoonBoat: L("sailboat-bacalar", "1600"),
  lagoonSUP:  L("kayak-sunrise", "1600"),
  pontoon:    L("pontoon-rapids", "1600"),
  cenote:     L("cenotes-tour", "1600"),
  cenote2:    L("cenotes-tour", "800"),
  ruins:      L("chacchoben-port", "1600"),
  chacchoben: L("chacchoben-port", "1600"),
  kohunlich:  L("kohunlich", "1600"),
  tulum:      L("tulum-day", "1600"),
  chichen:    L("chichen-itza", "1600"),
  chichen2:   L("chichen-itza", "800"),
  beach:      L("mahahual-beach-club", "1600"),
  beachClub:  L("mahahual-beach-club", "1600"),
  atv:        L("atv-jungle", "1600"),
  reef:       L("snorkel-reef", "1600"),
  reef2:      L("snorkel-reef", "800"),
  van:        L("transfer-cun", "1600"),
  jungle:     L("kohunlich", "1600"),
  sunset:     L("sailboat-bacalar", "1600"),
  group:      L("mahahual-beach-club", "800"),
  detail:     L("hero-lagoon", "1600")
};

window.tourPhoto = (tour) => {
  const byId = {
    'sailboat-bacalar':    window.PHOTOS.lagoonBoat,
    'pontoon-rapids':      window.PHOTOS.pontoon,
    'kayak-sunrise':       window.PHOTOS.lagoonSUP,
    'cenotes-tour':        window.PHOTOS.cenote,
    'chacchoben-port':     window.PHOTOS.chacchoben,
    'kohunlich':           window.PHOTOS.kohunlich,
    'tulum-day':           window.PHOTOS.tulum,
    'tulum-local':         window.PHOTOS.tulum,
    'chichen-itza':        window.PHOTOS.chichen,
    'chichen-riviera':     window.PHOTOS.chichen2,
    'mahahual-beach-club': window.PHOTOS.beachClub,
    'atv-jungle':          window.PHOTOS.atv,
    'snorkel-reef':        window.PHOTOS.reef,
    'ichkabal':            L('ichkabal', '1600'),
    'muyil-float':         L('muyil-float', '1600'),
    'dzibanche':           L('dzibanche', '1600'),
    'transfer-cun':        window.PHOTOS.van,
    'transfer-tulum':      L('transfer-tulum', '1600')
  };
  return byId[tour.id] || window.PHOTOS.lagoon;
};

// Contextual pool per category, used by tour-detail gallery.
// Values are raw preset keys (no suffix) so we can derive any size on the fly.
const POOL = {
  lagoon:    ['hero-lagoon', 'sailboat-bacalar', 'kayak-sunrise', 'pontoon-rapids', 'cenotes-tour', 'muyil-float'],
  ruins:     ['chacchoben-port', 'kohunlich', 'tulum-day', 'chichen-itza', 'ichkabal', 'dzibanche'],
  adventure: ['cenotes-tour', 'atv-jungle', 'kayak-sunrise', 'kohunlich', 'muyil-float'],
  ocean:     ['snorkel-reef', 'mahahual-beach-club', 'sailboat-bacalar'],
  beach:     ['mahahual-beach-club', 'snorkel-reef', 'sailboat-bacalar'],
  transfer:  ['transfer-cun', 'transfer-tulum', 'hero-lagoon', 'territory-map']
};

// Maps a tour.id → its primary generated preset key (same list as tourPhoto above).
const TOUR_TO_KEY = {
  'sailboat-bacalar':    'sailboat-bacalar',
  'pontoon-rapids':      'pontoon-rapids',
  'kayak-sunrise':       'kayak-sunrise',
  'cenotes-tour':        'cenotes-tour',
  'chacchoben-port':     'chacchoben-port',
  'kohunlich':           'kohunlich',
  'tulum-day':           'tulum-day',
  'tulum-local':         'tulum-day',
  'chichen-itza':        'chichen-itza',
  'chichen-riviera':     'chichen-itza',
  'mahahual-beach-club': 'mahahual-beach-club',
  'atv-jungle':          'atv-jungle',
  'snorkel-reef':        'snorkel-reef',
  'ichkabal':            'ichkabal',
  'muyil-float':         'muyil-float',
  'dzibanche':           'dzibanche',
  'transfer-cun':        'transfer-cun',
  'transfer-tulum':      'transfer-tulum'
};

// Returns up to 5 gallery entries: main + 4 contextual shots from the same category pool,
// de-duplicated and stable per tour id.
window.tourGallery = (tour) => {
  const mainKey = TOUR_TO_KEY[tour.id] || 'hero-lagoon';
  const poolKeys = (POOL[tour.category] || POOL.lagoon).filter(k => k !== mainKey);
  // pad with cross-category fillers if pool is short
  const fillers = ['hero-lagoon', 'territory-map', 'sailboat-bacalar', 'chacchoben-port'].filter(k => k !== mainKey && !poolKeys.includes(k));
  const keys = [...poolKeys, ...fillers];
  const labels = {
    lagoon:    ['LAGOON · WATER', 'GUIDE · CAPTAIN', 'GROUP · CANDID', 'DETAIL · SUNSET', 'ROUTE · MAP'],
    ruins:     ['MAYA · STONE', 'JUNGLE · PATH', 'DETAIL · CARVING', 'PLAZA · DAWN', 'ROUTE · MAP'],
    adventure: ['JUNGLE · ACTION', 'CENOTE · PLUNGE', 'RIDE · DETAIL', 'GROUP · CANDID', 'ROUTE · MAP'],
    ocean:     ['REEF · COLOR', 'BEACH · CLUB', 'BOAT · DECK', 'DETAIL · FISH', 'ROUTE · MAP'],
    beach:     ['BEACH · CLUB', 'REEF · COLOR', 'PIER · CARIBE', 'DETAIL · TURQUESA', 'ROUTE · MAP'],
    transfer:  ['VAN · PICKUP', 'ROUTE · MAP', 'COAST · ROAD', 'DESTINATION · ARRIVAL', 'ROUTE · MAP']
  };
  const lbl = labels[tour.category] || labels.lagoon;
  const shots = [{ src: L(mainKey, '1600'), label: tour.phLabel }];
  for (let i = 0; i < 4; i++) {
    shots.push({ src: L(keys[i] || mainKey, '1600'), label: lbl[i + 1] });
  }
  return shots;
};

// Photo component — real image with gradient scrim + mono caption
window.Photo = (props) => {
  var src = props.src, label = props.label, style = props.style, children = props.children;
  var overlay = props.overlay !== false;
  return React.createElement('div',
    { style: Object.assign({ position:'relative', overflow:'hidden', background:'var(--lagoon-deep)' }, style||{}) },
    React.createElement('img', { src: src, alt: '', loading: 'lazy',
      style: { position:'absolute', inset: 0, width:'100%', height:'100%', objectFit:'cover' },
      onError: function(e){ e.target.style.display = 'none'; } }),
    overlay && React.createElement('div', { style: { position:'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(12,42,46,0) 40%, rgba(12,42,46,0.6) 100%)' } }),
    label && React.createElement('span', { className: 'ph-label', style: { position:'absolute', left: 12, bottom: 12 } }, label),
    children
  );
};
