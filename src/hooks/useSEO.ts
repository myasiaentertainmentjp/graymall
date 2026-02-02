import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  canonicalUrl?: string;
  noIndex?: boolean;
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

export function useSEO({
  title,
  description,
  ogImage,
  ogType = 'website',
  canonicalUrl,
  noIndex = false,
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

    // Update OGP tags
    updateMetaTag('og:title', fullTitle, true);
    updateMetaTag('og:description', fullDescription, true);
    updateMetaTag('og:image', fullOgImage, true);
    updateMetaTag('og:type', ogType, true);
    updateMetaTag('og:url', fullCanonicalUrl, true);

    // Update Twitter tags
    updateMetaTag('twitter:title', fullTitle);
    updateMetaTag('twitter:description', fullDescription);
    updateMetaTag('twitter:image', fullOgImage);

    // Update canonical URL
    updateCanonicalUrl(fullCanonicalUrl);

    // Handle noindex
    setRobotsNoIndex(noIndex);

    // Cleanup on unmount - restore defaults
    return () => {
      document.title = DEFAULT_TITLE;
      updateMetaTag('description', DEFAULT_DESCRIPTION);
      updateMetaTag('og:title', DEFAULT_TITLE, true);
      updateMetaTag('og:description', DEFAULT_DESCRIPTION, true);
      updateMetaTag('og:image', DEFAULT_OG_IMAGE, true);
      updateMetaTag('og:type', 'website', true);
      updateMetaTag('og:url', SITE_URL, true);
      updateMetaTag('twitter:title', DEFAULT_TITLE);
      updateMetaTag('twitter:description', DEFAULT_DESCRIPTION);
      updateMetaTag('twitter:image', DEFAULT_OG_IMAGE);
      updateCanonicalUrl(SITE_URL);
      setRobotsNoIndex(false);
    };
  }, [title, description, ogImage, ogType, canonicalUrl, noIndex]);
}
