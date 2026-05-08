// Route table for the storefront. Loaded BEFORE React/Babel so it can run
// the legacy-hash redirect synchronously, before the SPA mounts.
//
// URL shape (clean URLs, served by Vercel rewrites that catch-all → index.html):
//   /                          → home
//   /tours                     → catalog
//   /tours/:filter             → catalog filtered
//   /tour/:slugOrId            → detail
//   /booking                   → booking
//   /thanks                    → thanks
//   /port                      → port flow
//   /transfers                 → transfers
//   /map                       → map
//   /map/:focus                → map with selected pin
//   /map-debug                 → pin calibration
//   /guia/:slug                → editorial landing (es)
//   /guide/:slug               → editorial landing (en)
(function () {
  function parseLocation() {
    const path = window.location.pathname || '/';
    const seg = path.split('/').filter(Boolean);
    const q = window.location.search
      ? Object.fromEntries(new URLSearchParams(window.location.search))
      : {};
    if (seg.length === 0)                        return { page: 'home',      params: { ...q } };
    if (seg[0] === 'tours')                      return { page: 'catalog',   params: { ...q, filter: seg[1] } };
    if (seg[0] === 'tour')                       return { page: 'detail',    params: { ...q, tourId: seg[1] } };
    if (seg[0] === 'booking')                    return { page: 'booking',   params: { ...q } };
    if (seg[0] === 'thanks')                     return { page: 'thanks',    params: { ...q } };
    if (seg[0] === 'port')                       return { page: 'port',      params: { ...q } };
    if (seg[0] === 'transfers')                  return { page: 'transfers', params: { ...q } };
    if (seg[0] === 'map' && seg[1] === 'debug')  return { page: 'map-debug', params: { ...q } };
    if (seg[0] === 'map')                        return { page: 'map',       params: { ...q, focus: seg[1] } };
    if (seg[0] === 'map-debug')                  return { page: 'map-debug', params: { ...q } };
    if (seg[0] === 'guia')                       return { page: 'landing',   params: { ...q, slug: seg[1], locale: 'es' } };
    if (seg[0] === 'guide')                      return { page: 'landing',   params: { ...q, slug: seg[1], locale: 'en' } };
    return { page: seg[0] || 'home', params: { ...q } };
  }

  function routeToPath(r) {
    if (!r || !r.page || r.page === 'home') return '/';
    const p = r.params || {};
    switch (r.page) {
      case 'catalog':    return p.filter ? '/tours/' + p.filter : '/tours';
      case 'detail':     return p.tourId ? '/tour/' + p.tourId : '/tour';
      case 'booking':    return '/booking';
      case 'thanks':     return '/thanks';
      case 'port':       return '/port';
      case 'transfers':  return '/transfers';
      case 'map':        return p.focus ? '/map/' + p.focus : '/map';
      case 'map-debug':  return '/map-debug';
      case 'landing':    return (p.locale === 'en' ? '/guide/' : '/guia/') + (p.slug || '');
      default:           return '/' + r.page;
    }
  }

  // Legacy #/... URLs (pre-clean-URLs) → rewrite to clean path BEFORE React
  // mounts, so the user never sees a hash flicker and the SPA reads the right
  // pathname on first parse. Returns true if a redirect happened.
  function redirectLegacyHash() {
    const h = window.location.hash;
    if (!h || h.length < 2 || h[1] !== '/') return false;
    const rest = h.slice(1); // "/tours/sailing" or "/tours/sailing?x=1"
    const search = window.location.search || '';
    const newUrl = rest.includes('?') ? rest : rest + search;
    window.history.replaceState(null, '', newUrl);
    return true;
  }

  window.parseLocation = parseLocation;
  window.routeToPath = routeToPath;
  window.redirectLegacyHash = redirectLegacyHash;

  // Run the redirect immediately so any code that reads the URL after this
  // script loads sees the canonical path.
  redirectLegacyHash();
})();
