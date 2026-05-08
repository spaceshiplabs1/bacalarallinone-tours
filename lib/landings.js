// Editorial landings — fetched from /landings/{locale}/{slug}.md as flat
// Markdown files with YAML frontmatter. Browser-side parsing (no build step).
//
// Frontmatter shape:
//   title:           string  (required — H1 + default <title>)
//   subtitle:        string  (optional)
//   metaTitle:       string  (optional — overrides <title> for SEO)
//   metaDescription: string  (optional — meta[description] + og:description)
//   hero:            string  (optional — absolute or root-relative image URL)
//   tourSlugs:       string[] (optional — one slug per line, indented '- slug')
//   alternateSlug:   string  (optional — slug for the OTHER locale, used for hreflang)
//   publishedAt:     YYYY-MM-DD (optional — schema.org dateModified)
//   updatedAt:       YYYY-MM-DD (optional)
(function () {
  function stripQuotes(s) {
    if (s == null) return s;
    if (s.length >= 2 && (
      (s[0] === '"' && s[s.length - 1] === '"') ||
      (s[0] === "'" && s[s.length - 1] === "'")
    )) return s.slice(1, -1);
    return s;
  }

  // Parses YAML frontmatter we control. Supports string scalars and lists
  // (block-style with '- item', or inline '[a, b, c]'). Anything fancier is
  // out of scope — landings have a small, stable schema.
  function parseFrontmatter(raw) {
    var m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!m) return { frontmatter: {}, body: raw };
    var yaml = m[1];
    var body = m[2] || '';
    var fm = {};
    var lines = yaml.split(/\r?\n/);
    var currentKey = null;
    var listAccum = null;
    function flushList() {
      if (currentKey && listAccum) {
        fm[currentKey] = listAccum;
      }
      currentKey = null;
      listAccum = null;
    }
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      if (!line.trim()) { flushList(); continue; }
      var listMatch = line.match(/^\s+-\s*(.+?)\s*$/);
      if (listMatch && currentKey) {
        if (!listAccum) listAccum = [];
        listAccum.push(stripQuotes(listMatch[1]));
        continue;
      }
      flushList();
      var kv = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
      if (!kv) continue;
      var key = kv[1];
      var val = kv[2].trim();
      if (val === '') {
        // Block list follows on indented '- item' lines.
        currentKey = key;
        listAccum = null;
      } else if (val.charAt(0) === '[' && val.charAt(val.length - 1) === ']') {
        var inner = val.slice(1, -1).trim();
        fm[key] = inner ? inner.split(',').map(function (x) { return stripQuotes(x.trim()); }) : [];
      } else {
        fm[key] = stripQuotes(val);
      }
    }
    flushList();
    return { frontmatter: fm, body: body };
  }

  // Cache: locale/slug → Promise. Avoids re-fetching on every render.
  var cache = new Map();

  function loadLanding(locale, slug) {
    if (!locale || !slug) return Promise.resolve(null);
    var key = locale + '/' + slug;
    if (cache.has(key)) return cache.get(key);
    var url = '/landings/' + locale + '/' + slug + '.md';
    var p = fetch(url)
      .then(function (r) { return r.ok ? r.text() : null; })
      .then(function (text) { return text ? parseFrontmatter(text) : null; })
      .catch(function () { return null; });
    cache.set(key, p);
    return p;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  // Render markdown body to HTML. Uses `marked` if loaded; degrades to a
  // <pre> block so the page still renders if the CDN is blocked.
  function renderBody(md) {
    if (!md) return '';
    if (window.marked && typeof window.marked.parse === 'function') {
      return window.marked.parse(md, { breaks: false, gfm: true });
    }
    return '<pre>' + escapeHtml(md) + '</pre>';
  }

  // Split a markdown body on inline markers so the renderer can interleave
  // React components (TourCard, map embeds) between rendered HTML chunks.
  // Supported markers (must each sit alone on their own line):
  //   {{tour:<slug>}}                        → horizontal tour card
  //   {{map:lat,lng,zoom?}}                  → static map (uses GOOGLE_MAPS_API_KEY)
  //   {{quote:author?|quote text}}            → pull-quote block
  // Returns: [{ kind: 'md', text } | { kind: 'tour', slug } | { kind: 'map', lat, lng, zoom } | { kind: 'quote', author, text }]
  function splitBody(body) {
    if (!body) return [];
    var re = /^[ \t]*\{\{(tour|map|quote):([^}]+)\}\}[ \t]*$/gm;
    var segments = [];
    var last = 0;
    var m;
    while ((m = re.exec(body)) !== null) {
      if (m.index > last) {
        var chunk = body.slice(last, m.index);
        if (chunk.trim()) segments.push({ kind: 'md', text: chunk });
      }
      var kind = m[1];
      var arg = m[2].trim();
      if (kind === 'tour') {
        segments.push({ kind: 'tour', slug: arg });
      } else if (kind === 'map') {
        var parts = arg.split(',').map(function (s) { return s.trim(); });
        var lat = parseFloat(parts[0]);
        var lng = parseFloat(parts[1]);
        var zoom = parts[2] ? parseInt(parts[2], 10) : 14;
        if (isFinite(lat) && isFinite(lng)) {
          segments.push({ kind: 'map', lat: lat, lng: lng, zoom: zoom });
        }
      } else if (kind === 'quote') {
        var pipe = arg.indexOf('|');
        if (pipe >= 0) {
          segments.push({ kind: 'quote', author: arg.slice(0, pipe).trim(), text: arg.slice(pipe + 1).trim() });
        } else {
          segments.push({ kind: 'quote', author: '', text: arg });
        }
      }
      last = m.index + m[0].length;
    }
    if (last < body.length) {
      var tail = body.slice(last);
      if (tail.trim()) segments.push({ kind: 'md', text: tail });
    }
    return segments;
  }

  // Resolve a slug list against window.TOURS. Missing slugs are silently
  // dropped so a soft-deleted tour doesn't break the landing.
  function resolveTours(slugs) {
    if (!Array.isArray(slugs) || !slugs.length) return [];
    var TOURS = window.TOURS || [];
    var bySlug = {};
    TOURS.forEach(function (t) { if (t && t.slug) bySlug[t.slug] = t; });
    return slugs.map(function (s) { return bySlug[s]; }).filter(Boolean);
  }

  // Layout tier picked from the count of associated tours:
  //   a: 1 tour   → editorial-first, sticky tour card
  //   b: 2-4      → editorial + grid mid-article
  //   c: 5+       → compact intro + tour grid below
  function pickTier(count) {
    if (count <= 1) return 'a';
    if (count <= 4) return 'b';
    return 'c';
  }

  // Static manifest of published landings. Keep in sync with the .md files
  // under /landings. The header nav dropdown reads this to enumerate guides.
  // Add new entries here when shipping a new landing.
  var manifest = {
    es: [
      { slug: 'laguna-estromatolitos', label: 'Laguna y Estromatolitos' },
      { slug: 'como-llegar-a-bacalar', label: 'Cómo llegar a Bacalar' }
    ],
    en: [
      { slug: 'lagoon-stromatolites', label: 'Lagoon & Stromatolites' },
      { slug: 'how-to-get-to-bacalar', label: 'How to get to Bacalar' }
    ]
  };

  window.tagcLandings = {
    parseFrontmatter: parseFrontmatter,
    loadLanding: loadLanding,
    renderBody: renderBody,
    splitBody: splitBody,
    resolveTours: resolveTours,
    pickTier: pickTier,
    manifest: manifest
  };
})();
