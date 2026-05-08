// Static-page SEO copy registry. Keyed by route page name + locale.
// For dynamic pages (detail, landings) this is the FALLBACK; the page's
// <PageSeo> component overrides individual fields per render.
//
// Image paths are absolute (start with /) and resolve to the live origin via
// <base href="/"> in index.html.
(function () {
  var SITE = {
    name: 'bacalarallinone.tours',
    origin: 'https://bacalarallinone.tours',
    defaultOg: '/images/hero-lagoon-1600.webp',
    logo: '/images/hero-lagoon-1600.webp',
    sameAs: [],
    twitter: { site: '', creator: '' }
  };

  // Per-page copy. `robots` is optional — defaults to 'index,follow' globally
  // when omitted. `image` is optional — falls back to SITE.defaultOg.
  var META = {
    home: {
      es: {
        title: 'Tours en Bacalar, Mahahual y la Riviera Maya — bacalarallinone.tours',
        description: 'Tours en Bacalar, Mahahual y la Riviera Maya. Capitanes locales, excursiones port-friendly y traslados privados.'
      },
      en: {
        title: 'Tours in Bacalar, Mahahual & the Mayan Riviera — bacalarallinone.tours',
        description: 'Tours in Bacalar, Mahahual and the Mayan Riviera. Local captains, port-friendly day trips, private transfers.'
      }
    },
    catalog: {
      es: {
        title: 'Tours y aventuras — bacalarallinone.tours',
        description: 'Catálogo completo: laguna, cenotes, ruinas, navegación y más.'
      },
      en: {
        title: 'Tours & adventures — bacalarallinone.tours',
        description: 'Full catalog: lagoon, cenotes, ruins, sailing and more.'
      }
    },
    port: {
      es: {
        title: 'Tours desde el puerto Costa Maya — bacalarallinone.tours',
        description: 'Excursiones de medio día y día completo desde el puerto de Mahahual / Costa Maya.'
      },
      en: {
        title: 'Cruise port tours — Costa Maya / Mahahual',
        description: 'Half-day and full-day shore excursions from Costa Maya cruise port.'
      }
    },
    transfers: {
      es: {
        title: 'Traslados aeropuerto — bacalarallinone.tours',
        description: 'Traslados privados desde y hacia los aeropuertos de Cancún, Tulum y Chetumal.'
      },
      en: {
        title: 'Airport transfers — bacalarallinone.tours',
        description: 'Private airport transfers from Cancún, Tulum and Chetumal.'
      }
    },
    map: {
      es: {
        title: 'Mapa de destinos — bacalarallinone.tours',
        description: 'Explora los destinos en el mapa: laguna, cenotes, ruinas y más.'
      },
      en: {
        title: 'Destinations map — bacalarallinone.tours',
        description: 'Explore Bacalar destinations on the map: lagoon, cenotes, ruins and more.'
      }
    },
    booking: {
      es: { title: 'Finalizar compra — bacalarallinone.tours', description: '', robots: 'noindex,nofollow' },
      en: { title: 'Checkout — bacalarallinone.tours',         description: '', robots: 'noindex,nofollow' }
    },
    thanks: {
      es: { title: 'Gracias — bacalarallinone.tours', description: '', robots: 'noindex,nofollow' },
      en: { title: 'Thanks — bacalarallinone.tours',  description: '', robots: 'noindex,nofollow' }
    },
    'map-debug': {
      es: { title: 'Map debug', description: '', robots: 'noindex,nofollow' },
      en: { title: 'Map debug', description: '', robots: 'noindex,nofollow' }
    }
  };

  window.SEO_SITE = SITE;
  window.SEO_META = META;
})();
