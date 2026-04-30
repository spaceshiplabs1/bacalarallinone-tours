// data-api.js — replaces the static data.js with live data from the
// travelagencee.com backend. Designed so the existing components keep
// working unchanged: we shape the API response into the same fields the
// previous static catalog exposed via window.TOURS.
//
// Override the API base URL at runtime by setting window.__TAGC_API__
// before this script runs (or via a query param if you want to test
// against a local backend).

(function () {
  const API =
    window.__TAGC_API__ ||
    "https://backend-production-de7a.up.railway.app";

  // When running against a deployed bacalarallinone-tours.vercel.app or
  // bacalarallinone.tours, the backend resolves the tenant from the request
  // `Host` header automatically. But on a local dev server (or any non-
  // registered host) the backend can't tell which tenant we're representing
  // — it returns 404 tenant_not_found. Send `x-tenant-host` so the API
  // always knows which agency this site is.
  const TENANT_HOST =
    window.__TAGC_TENANT_HOST__ || "bacalarallinone-tours.vercel.app";

  const API_HEADERS = { "x-tenant-host": TENANT_HOST };

  // Synchronous placeholder so components that render before the fetch
  // resolves (e.g. detail page on a deep-link refresh) get a complete tour
  // shape from window.TOURS[0] / .find(...) instead of `undefined`. The
  // placeholder gets replaced as soon as loadCatalog() resolves and we
  // dispatch __routechange.
  const PLACEHOLDER_TOUR = {
    id: "__loading__",
    slug: "__loading__",
    title: { en: "Loading…", es: "Cargando…" },
    tagline: { en: "", es: "" },
    category: "lagoon",
    audience: ["regular"],
    location: "",
    duration: 0,
    priceAdult: 0,
    priceKid: 0,
    rating: 0,
    reviews: 0,
    tags: [],
    includes: [],
    times: [],
    color: "lagoon",
    phLabel: "LOADING",
    pickupPoints: [
      { label: { en: "", es: "" }, surcharge: 0, etaMin: 0 },
    ],
    flat: false,
    coverUrl: null,
    _gallery: [],
    _detailLoaded: false,
  };
  window.TOURS = [PLACEHOLDER_TOUR];

  // Static editorial content kept on the front-end for now (the API doesn't
  // expose reviews or the territory-map pins yet).
  window.REVIEWS = [
    { tour: "bacalar-sailboat-sunset", name: "Marta G.", flag: "🇪🇸", rating: 5, date: "Mar 2026", body: { en: "Captain Beto was the soul of the trip. The water really is seven colors — photos don't lie.", es: "El capitán Beto fue el alma del viaje. El agua es realmente de siete colores." } },
    { tour: "bacalar-sailboat-sunset", name: "James T.", flag: "🇺🇸", rating: 5, date: "Feb 2026", body: { en: "Booked day-of via WhatsApp, they picked us up at our hotel 20 min later. Unreal.", es: "Reservé el mismo día por WhatsApp, nos recogieron en 20 min." } },
    { tour: "chacchoben-ruins-mahahual", name: "Linda P.", flag: "🇺🇸", rating: 5, date: "Apr 2026", body: { en: "Our ship was Carnival Horizon. We were back at the pier with 90 min to spare and felt zero stress.", es: "Nuestro barco era Carnival Horizon. Volvimos al muelle con 90 min de sobra, cero estrés." } },
    { tour: "atv-jungle-cenote", name: "Kai S.", flag: "🇩🇪", rating: 5, date: "Mar 2026", body: { en: "Muddy, fast, incredible. The cenote at the end was freezing and perfect.", es: "Lodoso, rápido, increíble. El cenote al final estaba helado y perfecto." } },
    { tour: "pontoon-piratas-rapidos-cocalitos", name: "Sofía M.", flag: "🇲🇽", rating: 5, date: "Feb 2026", body: { en: "El pontón privado fue el highlight de nuestra luna de miel. El ceviche, divino.", es: "El pontón privado fue el highlight de nuestra luna de miel. El ceviche, divino." } },
    { tour: "muyil-sian-kaan-floating-canals", name: "Elena R.", flag: "🇲🇽", rating: 5, date: "Apr 2026", body: { en: "Flotar por el canal con el sonido de la selva fue meditativo. Lo mejor del viaje.", es: "Flotar por el canal con el sonido de la selva fue meditativo. Lo mejor del viaje." } },
    { tour: "ichkabal-new-mayan-ruins", name: "Ben H.", flag: "🇬🇧", rating: 5, date: "Mar 2026", body: { en: "Being on top of a freshly-uncovered pyramid with no one around is surreal. Go before the crowds find it.", es: "Estar en una pirámide recién descubierta, sin nadie, es surreal. Ve antes de que la encuentren." } },
  ];

  window.MAP_PINS = [
    { id: "bacalar",    name: "Bacalar",       x: 41.79, y: 70.87, count: 7, label: { en: "Lagoon Tours",        es: "Tours Laguna"          } },
    { id: "mahahual",   name: "Mahahual",      x: 60.87, y: 75.02, count: 5, label: { en: "Port · Beach · ATV",   es: "Puerto · Playa · ATV" } },
    { id: "chacchoben", name: "Chacchoben",    x: 51.92, y: 66.89, count: 1, label: { en: "Mayan Ruins",          es: "Ruinas Mayas"         } },
    { id: "kohunlich",  name: "Kohunlich",     x: 25.83, y: 88.35, count: 1, label: { en: "Temple of Masks",      es: "Templo Mascarones"    } },
    { id: "ichkabal",   name: "Ichkabal",      x: 47.50, y: 80.04, count: 1, label: { en: "New ruins (2024)",     es: "Ruinas nuevas (2024)" } },
    { id: "dzibanche",  name: "Dzibanché",     x: 29.98, y: 78.31, count: 1, label: { en: "Twin pyramids",         es: "Pirámides gemelas"   } },
    { id: "muyil",      name: "Muyil",         x: 51.14, y: 52.35, count: 1, label: { en: "Sian Ka'an floats",     es: "Canales Sian Ka'an"  } },
    { id: "tulum",      name: "Tulum",         x: 60.09, y: 32.62, count: 2, label: { en: "Ruins + TQO Airport",  es: "Ruinas + Aeropuerto"  } },
    { id: "cancun",     name: "Cancún",        x: 69.18, y:  9.09, count: 2, label: { en: "CUN Airport",          es: "Aeropuerto CUN"       } },
    { id: "chichen",    name: "Chichén Itzá",  x: 30.50, y: 21.03, count: 2, label: { en: "World Wonder",         es: "Maravilla"            } },
  ];

  function parseInclusionsHtml(html) {
    if (!html) return [];
    const matches = html.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
    return matches
      .map((m) => m.replace(/<[^>]*>/g, "").trim())
      .filter(Boolean);
  }

  function audienceFromTags(tags) {
    const slugs = tags.map((t) => (typeof t === "string" ? t : t.slug));
    return slugs.includes("port-friendly")
      ? ["port", "regular"]
      : ["regular"];
  }

  // Map our category slug → the existing site's color token.
  const COLOR_BY_CATEGORY = {
    lagoon: "lagoon",
    ruins: "clay",
    "mayan-ruins": "clay",
    adventure: "jungle",
    beach: "sun",
    ocean: "deep",
    transfer: "jungle",
  };

  function shapeListItem(en, es) {
    const t = en;
    const e = es || null;
    return {
      // Existing components find tours by `id`; we use slug as the canonical
      // id since slug is unique per tenant and stable.
      id: t.slug,
      slug: t.slug,
      title: {
        en: t.translation.name,
        es: e?.translation?.name ?? t.translation.name,
      },
      tagline: {
        en: t.translation.shortDescription || "",
        es:
          e?.translation?.shortDescription ||
          t.translation.shortDescription ||
          "",
      },
      category: t.category?.slug ?? "lagoon",
      audience: audienceFromTags(t.tags || []),
      location: t.category?.name ?? "",
      duration: Math.max(1, Math.round(t.durationMinutes / 60)),
      priceAdult: t.basePrice ? Math.round(t.basePrice / 100) : 0,
      priceKid:
        t.isKidFriendly && t.basePrice
          ? Math.round((t.basePrice / 100) * 0.5)
          : 0,
      rating: 4.8,
      reviews: 0,
      tags: (t.tags || []).map((x) => x.slug),
      includes: parseInclusionsHtml(t.translation.inclusionsHtml),
      times: [],
      color: COLOR_BY_CATEGORY[t.category?.slug] ?? "lagoon",
      phLabel: (t.translation.name || "").toUpperCase().slice(0, 32),
      pickupPoints: [
        {
          label: { en: "Default pickup", es: "Pickup principal" },
          surcharge: 0,
          etaMin: 0,
        },
      ],
      coverUrl: t.coverImage?.url ?? null,
      flat: t.category?.slug === "transfer",
      _gallery: t.coverImage?.url
        ? [{ src: t.coverImage.url, label: "" }]
        : [],
      _detailLoaded: false,
    };
  }

  async function loadCatalog() {
    const [enRes, esRes] = await Promise.all([
      fetch(`${API}/api/tours?limit=50&locale=en`, { credentials: "include", headers: API_HEADERS }),
      fetch(`${API}/api/tours?limit=50&locale=es`, { credentials: "include", headers: API_HEADERS }),
    ]);
    if (!enRes.ok) throw new Error(`API list ${enRes.status}`);
    const enList = (await enRes.json()).tours;
    const esList = esRes.ok ? (await esRes.json()).tours : [];
    const esBySlug = Object.fromEntries(esList.map((t) => [t.slug, t]));
    return enList.map((t) => shapeListItem(t, esBySlug[t.slug]));
  }

  // Fill in detail-only fields (full gallery, schedules, pickup zones,
  // long-form translations) on first navigation to a tour. Caches on the
  // tour object so subsequent reads are free.
  async function ensureDetail(tour) {
    if (!tour || tour._detailLoaded) return tour;
    try {
      const [enRes, esRes] = await Promise.all([
        fetch(`${API}/api/tours/${tour.slug}?locale=en`, {
          credentials: "include",
          headers: API_HEADERS,
        }),
        fetch(`${API}/api/tours/${tour.slug}?locale=es`, {
          credentials: "include",
          headers: API_HEADERS,
        }),
      ]);
      if (enRes.ok) {
        const en = await enRes.json();
        const sched = (en.schedules || []).find((s) => s.isActive !== false);
        tour.times = sched?.startTimes || tour.times;
        if (en.translation?.inclusionsHtml) {
          tour.includes = parseInclusionsHtml(en.translation.inclusionsHtml);
        }
        tour._gallery = (en.images || []).map((im) => ({
          src: im.url,
          label: "",
        }));
        if (en.pickupZones?.length) {
          tour.pickupPoints = en.pickupZones.map((z) => ({
            label: { en: z.name, es: z.name },
            surcharge: 0,
            etaMin: 0,
          }));
        }
      }
      if (esRes.ok) {
        const es = await esRes.json();
        tour.title.es = es.translation?.name || tour.title.es;
        tour.tagline.es =
          es.translation?.shortDescription || tour.tagline.es;
      }
      tour._detailLoaded = true;
      // Force a re-render so newly-arrived gallery / times / etc. show up.
      window.dispatchEvent(new Event("__routechange"));
    } catch (e) {
      console.warn("[tagc] tour detail load failed:", tour.slug, e);
    }
    return tour;
  }

  // photos.jsx exports tourPhoto + tourGallery. We override with API-driven
  // versions so existing components don't render local placeholder paths.
  window.tourPhoto = function (tour) {
    if (!tour) return "./images/hero-lagoon.webp";
    return (
      tour.coverUrl ||
      tour._gallery?.[0]?.src ||
      "./images/hero-lagoon.webp"
    );
  };

  window.tourGallery = function (tour) {
    if (!tour) return [];
    if (tour._gallery && tour._gallery.length > 1) return tour._gallery;
    // Kick off detail-load (which populates _gallery and re-renders) but
    // return what we have synchronously to avoid blank UI on first paint.
    if (tour.slug) ensureDetail(tour);
    if (tour._gallery && tour._gallery.length) return tour._gallery;
    if (tour.coverUrl) return [{ src: tour.coverUrl, label: "" }];
    return [];
  };

  window.tagcEnsureDetail = ensureDetail;

  // Initial catalog load. Re-render the page when ready.
  loadCatalog()
    .then((list) => {
      window.TOURS = list;
      window.dispatchEvent(new Event("__routechange"));
    })
    .catch((err) => {
      console.error("[tagc] catalog load failed:", err);
    });
})();
