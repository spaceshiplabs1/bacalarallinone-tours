// JSON-LD builders. Plain JS, no React. Each helper returns a plain object
// that callers stringify into a <script type="application/ld+json"> tag.
//
// Builders return null/undefined when there's nothing useful to emit so the
// outlet can filter them out. Don't emit empty Organization, etc.
(function () {
  function organizationLd(site) {
    return {
      '@context': 'https://schema.org',
      '@type': 'TravelAgency',
      name: site.name,
      url: site.origin,
      logo: site.logo ? site.origin + site.logo : undefined,
      sameAs: (site.sameAs && site.sameAs.length) ? site.sameAs : undefined
    };
  }

  function websiteLd(site, locale) {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      url: site.origin,
      name: site.name,
      inLanguage: locale === 'es' ? 'es-MX' : 'en-US',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: site.origin + '/tours?q={search_term_string}'
        },
        'query-input': 'required name=search_term_string'
      }
    };
  }

  function breadcrumbLd(items) {
    if (!items || !items.length) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map(function (it, i) {
        return {
          '@type': 'ListItem',
          position: i + 1,
          name: it.name,
          item: it.url
        };
      })
    };
  }

  function tourLd(tour, locale, ctx) {
    if (!tour) return null;
    var title = (tour.title && (tour.title[locale] || tour.title.en)) || '';
    var description = (tour.tagline && (tour.tagline[locale] || tour.tagline.en)) || '';
    return {
      '@context': 'https://schema.org',
      '@type': 'TouristTrip',
      name: title,
      description: description,
      image: ctx.absImage,
      url: ctx.url,
      touristType: tour.audience,
      provider: { '@type': 'TravelAgency', name: ctx.siteName, url: ctx.origin },
      offers: {
        '@type': 'Offer',
        priceCurrency: tour.defaultCurrency || 'USD',
        price: tour.priceAdult,
        availability: tour.isRequestOnly
          ? 'https://schema.org/InStoreOnly'
          : 'https://schema.org/InStock',
        url: ctx.url
      },
      aggregateRating: (tour.rating && tour.reviews) ? {
        '@type': 'AggregateRating',
        ratingValue: tour.rating,
        reviewCount: tour.reviews,
        bestRating: 5,
        worstRating: 1
      } : undefined
    };
  }

  function articleLd(article, locale, ctx) {
    if (!article) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.title,
      description: article.description,
      image: ctx.absImage,
      url: ctx.url,
      inLanguage: locale === 'es' ? 'es-MX' : 'en-US',
      datePublished: article.publishedAt,
      dateModified: article.updatedAt || article.publishedAt,
      author: { '@type': 'Organization', name: ctx.siteName, url: ctx.origin },
      publisher: {
        '@type': 'Organization',
        name: ctx.siteName,
        url: ctx.origin,
        logo: ctx.logo ? { '@type': 'ImageObject', url: ctx.logo } : undefined
      }
    };
  }

  function itemListLd(items, ctx) {
    if (!items || !items.length) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: items.map(function (tour, i) {
        var title = (tour.title && (tour.title[ctx.locale] || tour.title.en)) || '';
        var slug = tour.slug || tour.id;
        return {
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'TouristTrip',
            name: title,
            url: ctx.origin + '/tour/' + slug
          }
        };
      })
    };
  }

  // Convenience: build the ctx object every JSON-LD helper expects, given a
  // route + (optionally) an image path. Pages call this once and pass the
  // result into one or more *Ld() builders.
  function ctxFor(route, image) {
    var SITE = window.SEO_SITE || { name: '', origin: '', logo: '' };
    var path = window.routeToPath ? window.routeToPath(route) : '/';
    var url = SITE.origin + path;
    var absImage = '';
    if (image) {
      try { absImage = new URL(image, SITE.origin).href; }
      catch (_e) { absImage = image; }
    }
    return {
      siteName: SITE.name,
      origin: SITE.origin,
      logo: SITE.logo ? SITE.origin + SITE.logo : '',
      url: url,
      absImage: absImage,
      locale: (document.documentElement.getAttribute('lang') || 'en')
    };
  }

  window.tagcSchema = {
    organizationLd: organizationLd,
    websiteLd: websiteLd,
    breadcrumbLd: breadcrumbLd,
    tourLd: tourLd,
    articleLd: articleLd,
    itemListLd: itemListLd,
    ctxFor: ctxFor
  };
})();
