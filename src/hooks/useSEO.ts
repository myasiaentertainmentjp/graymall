import { useEffect } from 'react';

interface ArticleStructuredData {
  title: string;
  description: string;
  image?: string;
  authorName: string;
  publishedAt: string;
  modifiedAt?: string;
  slug: string;
  price?: number | null;
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface ItemListItem {
  name: string;
  url: string;
  image?: string;
  description?: string;
}

interface PersonData {
  name: string;
  url: string;
  image?: string;
  description?: string;
  jobTitle?: string;
}

interface OrganizationData {
  name: string;
  url: string;
  logo: string;
  description?: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQData {
  items: FAQItem[];
}

interface SEOProps {
  title?: string;
  description?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'profile';
  canonicalUrl?: string;
  noIndex?: boolean;
  articleData?: ArticleStructuredData;
  breadcrumbs?: BreadcrumbItem[];
  itemList?: ItemListItem[];
  personData?: PersonData;
  organizationData?: OrganizationData;
  pagination?: { currentPage: number; totalPages: number; baseUrl: string };
  keywords?: string[];
  faqData?: FAQData;
}

const DEFAULT_TITLE = 'グレーモール - デジタルコンテンツマーケットプレイス';
const DEFAULT_DESCRIPTION = 'グレーモールは、個人の体験談やノウハウを販売・購入できるデジタルコンテンツマーケットプレイスです。';
const DEFAULT_OG_IMAGE = 'https://graymall.jp/ogp-default.png';
const SITE_URL = 'https://graymall.jp';

function updateMetaTag(property: string, content: string, isOgTag = false) {
  const selector = isOgTag
    ? `meta[property="${property}"]`
    : `meta[name="${property}"]`;

  let element = document.querySelector(selector) as HTMLMetaElement | null;

  if (!element) {
    element = document.createElement('meta');
    if (isOgTag) {
      element.setAttribute('property', property);
    } else {
      element.setAttribute('name', property);
    }
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
}

function updateCanonicalUrl(url: string) {
  let element = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;

  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', 'canonical');
    document.head.appendChild(element);
  }

  element.setAttribute('href', url);
}

function setRobotsNoIndex(noIndex: boolean) {
  let element = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;

  if (noIndex) {
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute('name', 'robots');
      document.head.appendChild(element);
    }
    element.setAttribute('content', 'noindex, nofollow');
  } else if (element) {
    element.remove();
  }
}

function updateStructuredData(id: string, data: object | null) {
  const existingScript = document.querySelector(`script[data-structured="${id}"]`);

  if (data === null) {
    if (existingScript) existingScript.remove();
    return;
  }

  if (existingScript) {
    existingScript.textContent = JSON.stringify(data);
  } else {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-structured', id);
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }
}

function createArticleSchema(data: ArticleStructuredData): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: data.title,
    description: data.description,
    image: data.image || DEFAULT_OG_IMAGE,
    author: {
      '@type': 'Person',
      name: data.authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: 'グレーモール',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
    datePublished: data.publishedAt,
    dateModified: data.modifiedAt || data.publishedAt,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/articles/${data.slug}`,
    },
  };
}

function createBreadcrumbSchema(items: BreadcrumbItem[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}

function createWebsiteSchema(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'グレーモール',
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/articles?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

function createItemListSchema(items: ItemListItem[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.slice(0, 10).map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Article',
        name: item.name,
        url: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
        ...(item.image && { image: item.image }),
        ...(item.description && { description: item.description }),
      },
    })),
  };
}

function createPersonSchema(data: PersonData): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: data.name,
    url: data.url.startsWith('http') ? data.url : `${SITE_URL}${data.url}`,
    ...(data.image && { image: data.image }),
    ...(data.description && { description: data.description }),
    ...(data.jobTitle && { jobTitle: data.jobTitle }),
  };
}

function createOrganizationSchema(data: OrganizationData): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: data.name,
    url: data.url,
    logo: data.logo,
    ...(data.description && { description: data.description }),
  };
}

function createFAQSchema(data: FAQData): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: data.items.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

function createProductSchema(data: ArticleStructuredData): object | null {
  // 有料記事の場合のみProduct構造化データを生成
  if (!data.price || data.price <= 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: data.title,
    description: data.description,
    image: data.image || DEFAULT_OG_IMAGE,
    brand: {
      '@type': 'Brand',
      name: 'グレーモール',
    },
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/articles/${data.slug}`,
      priceCurrency: 'JPY',
      price: data.price,
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Person',
        name: data.authorName,
      },
    },
  };
}

function updatePaginationLinks(pagination: { currentPage: number; totalPages: number; baseUrl: string } | undefined) {
  // Remove existing pagination links
  document.querySelectorAll('link[rel="prev"], link[rel="next"]').forEach(el => el.remove());

  if (!pagination || pagination.totalPages <= 1) return;

  const { currentPage, totalPages, baseUrl } = pagination;
  const getPageUrl = (page: number) => {
    const url = page === 1 ? baseUrl : `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}page=${page}`;
    return url.startsWith('http') ? url : `${SITE_URL}${url}`;
  };

  if (currentPage > 1) {
    const prevLink = document.createElement('link');
    prevLink.rel = 'prev';
    prevLink.href = getPageUrl(currentPage - 1);
    document.head.appendChild(prevLink);
  }

  if (currentPage < totalPages) {
    const nextLink = document.createElement('link');
    nextLink.rel = 'next';
    nextLink.href = getPageUrl(currentPage + 1);
    document.head.appendChild(nextLink);
  }
}

export function useSEO({
  title,
  description,
  ogImage,
  ogType = 'website',
  canonicalUrl,
  noIndex = false,
  articleData,
  breadcrumbs,
  itemList,
  personData,
  organizationData,
  pagination,
  keywords,
  faqData,
}: SEOProps = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} | グレーモール` : DEFAULT_TITLE;
    const fullDescription = description || DEFAULT_DESCRIPTION;
    const fullOgImage = ogImage || DEFAULT_OG_IMAGE;
    const fullCanonicalUrl = canonicalUrl
      ? `${SITE_URL}${canonicalUrl.startsWith('/') ? '' : '/'}${canonicalUrl}`
      : SITE_URL + window.location.pathname;

    // Update title
    document.title = fullTitle;

    // Update description
    updateMetaTag('description', fullDescription);

    // Update keywords (for LLMO/AI optimization)
    if (keywords && keywords.length > 0) {
      updateMetaTag('keywords', keywords.join(','));
    }

    // Update OGP tags
    updateMetaTag('og:title', fullTitle, true);
    updateMetaTag('og:description', fullDescription, true);
    updateMetaTag('og:image', fullOgImage, true);
    updateMetaTag('og:type', ogType, true);
    updateMetaTag('og:url', fullCanonicalUrl, true);
    updateMetaTag('og:site_name', 'グレーモール', true);
    updateMetaTag('og:locale', 'ja_JP', true);

    // Article-specific OGP tags
    if (articleData) {
      updateMetaTag('article:published_time', articleData.publishedAt, true);
      if (articleData.modifiedAt) {
        updateMetaTag('article:modified_time', articleData.modifiedAt, true);
      }
      updateMetaTag('article:author', articleData.authorName, true);
      // Author meta tag (LLMO optimization)
      updateMetaTag('author', articleData.authorName);
    }

    // Article tags (LLMO optimization)
    if (keywords && keywords.length > 0) {
      // Remove existing article:tag meta tags
      document.querySelectorAll('meta[property="article:tag"]').forEach(el => el.remove());
      // Add new article:tag meta tags (max 5)
      keywords.slice(0, 5).forEach(tag => {
        const meta = document.createElement('meta');
        meta.setAttribute('property', 'article:tag');
        meta.setAttribute('content', tag);
        document.head.appendChild(meta);
      });
    }

    // Update Twitter tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', fullTitle);
    updateMetaTag('twitter:description', fullDescription);
    updateMetaTag('twitter:image', fullOgImage);

    // Update canonical URL
    updateCanonicalUrl(fullCanonicalUrl);

    // Handle noindex
    setRobotsNoIndex(noIndex);

    // Update structured data (JSON-LD)
    // Always add WebSite schema on homepage
    if (window.location.pathname === '/' || window.location.pathname === '') {
      updateStructuredData('website', createWebsiteSchema());
    } else {
      updateStructuredData('website', null);
    }

    // Add Article schema if article data is provided
    if (articleData) {
      updateStructuredData('article', createArticleSchema(articleData));
      // Add Product schema for paid articles (EC/marketplace optimization)
      const productSchema = createProductSchema(articleData);
      updateStructuredData('product', productSchema);
    } else {
      updateStructuredData('article', null);
      updateStructuredData('product', null);
    }

    // Add Breadcrumb schema if breadcrumbs are provided
    if (breadcrumbs && breadcrumbs.length > 0) {
      updateStructuredData('breadcrumb', createBreadcrumbSchema(breadcrumbs));
    } else {
      updateStructuredData('breadcrumb', null);
    }

    // Add ItemList schema if itemList is provided (for list pages)
    if (itemList && itemList.length > 0) {
      updateStructuredData('itemlist', createItemListSchema(itemList));
    } else {
      updateStructuredData('itemlist', null);
    }

    // Add Person schema if personData is provided (for author pages)
    if (personData) {
      updateStructuredData('person', createPersonSchema(personData));
    } else {
      updateStructuredData('person', null);
    }

    // Add Organization schema if organizationData is provided
    if (organizationData) {
      updateStructuredData('organization', createOrganizationSchema(organizationData));
    } else {
      updateStructuredData('organization', null);
    }

    // Add FAQPage schema if faqData is provided
    if (faqData && faqData.items.length > 0) {
      updateStructuredData('faq', createFAQSchema(faqData));
    } else {
      updateStructuredData('faq', null);
    }

    // Update pagination links (rel=prev/next)
    updatePaginationLinks(pagination);

    // Cleanup on unmount - restore defaults
    return () => {
      document.title = DEFAULT_TITLE;
      updateMetaTag('description', DEFAULT_DESCRIPTION);
      updateMetaTag('og:title', DEFAULT_TITLE, true);
      updateMetaTag('og:description', DEFAULT_DESCRIPTION, true);
      updateMetaTag('og:image', DEFAULT_OG_IMAGE, true);
      updateMetaTag('og:type', 'website', true);
      updateMetaTag('og:url', SITE_URL, true);
      updateMetaTag('twitter:card', 'summary_large_image');
      updateMetaTag('twitter:title', DEFAULT_TITLE);
      updateMetaTag('twitter:description', DEFAULT_DESCRIPTION);
      updateMetaTag('twitter:image', DEFAULT_OG_IMAGE);
      updateCanonicalUrl(SITE_URL);
      setRobotsNoIndex(false);
      // Remove structured data
      updateStructuredData('website', null);
      updateStructuredData('article', null);
      updateStructuredData('product', null);
      updateStructuredData('breadcrumb', null);
      updateStructuredData('itemlist', null);
      updateStructuredData('person', null);
      updateStructuredData('organization', null);
      updateStructuredData('faq', null);
      // Remove pagination links
      document.querySelectorAll('link[rel="prev"], link[rel="next"]').forEach(el => el.remove());
      // Remove article:tag meta tags
      document.querySelectorAll('meta[property="article:tag"]').forEach(el => el.remove());
    };
  }, [title, description, ogImage, ogType, canonicalUrl, noIndex, articleData, breadcrumbs, itemList, personData, organizationData, pagination, keywords, faqData]);
}
