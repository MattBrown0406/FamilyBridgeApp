import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonicalPath?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  noIndex?: boolean;
  structuredData?: object;
}

/**
 * SEO component that manages document head meta tags
 * Updates meta tags dynamically when props change
 */
export const SEOHead = ({
  title = 'FamilyBridge - Recovery Support for Families',
  description = 'FamilyBridge helps families support loved ones in recovery with transparent communication, financial coordination, and accountability tools.',
  canonicalPath = '/',
  ogImage = '/og-image.png',
  ogType = 'website',
  noIndex = false,
  structuredData,
}: SEOHeadProps) => {
  const baseUrl = 'https://familybridgeapp.com';
  const fullUrl = `${baseUrl}${canonicalPath}`;
  const fullImageUrl = ogImage.startsWith('http') ? ogImage : `${baseUrl}${ogImage}`;
  const fullTitle = title.includes('FamilyBridge') ? title : `${title} | FamilyBridge`;

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Helper to update or create meta tags
    const setMetaTag = (name: string, content: string, isProperty = false) => {
      const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (isProperty) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Standard meta tags
    setMetaTag('description', description);
    
    // Robots meta
    if (noIndex) {
      setMetaTag('robots', 'noindex, nofollow');
    } else {
      // Remove noindex if it exists
      const robotsMeta = document.querySelector('meta[name="robots"]');
      if (robotsMeta) {
        robotsMeta.remove();
      }
    }

    // Open Graph tags
    setMetaTag('og:title', fullTitle, true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:url', fullUrl, true);
    setMetaTag('og:image', fullImageUrl, true);
    setMetaTag('og:type', ogType, true);

    // Twitter tags
    setMetaTag('twitter:title', fullTitle);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:image', fullImageUrl);

    // Update canonical link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', fullUrl);

    // Add structured data if provided
    if (structuredData) {
      // Remove existing dynamic structured data
      const existingScript = document.querySelector('script[data-seo-structured-data]');
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo-structured-data', 'true');
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);

      return () => {
        script.remove();
      };
    }
  }, [fullTitle, description, fullUrl, fullImageUrl, ogType, noIndex, structuredData]);

  return null;
};

// Common structured data schemas
export const createBreadcrumbSchema = (items: { name: string; url: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: `https://familybridgeapp.com${item.url}`,
  })),
});

export const createFAQSchema = (faqs: { question: string; answer: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
});

export const createOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'FamilyBridge',
  url: 'https://familybridgeapp.com',
  logo: 'https://familybridgeapp.com/favicon.png',
  description: 'FamilyBridge helps families support loved ones in recovery with AI-powered pattern detection, transparent communication, financial coordination, and accountability tools.',
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'matt@freedominterventions.com',
    contactType: 'customer support',
  },
  knowsAbout: [
    'Addiction Recovery',
    'Family Support', 
    'Recovery Programs',
    'Sober Living',
    'Intervention Services',
  ],
  sameAs: [],
});

// AEO-optimized product schema
export const createProductSchema = (product: {
  name: string;
  description: string;
  price: string;
  priceCurrency?: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.name,
  description: product.description,
  brand: {
    '@type': 'Brand',
    name: 'FamilyBridge',
  },
  offers: {
    '@type': 'Offer',
    price: product.price,
    priceCurrency: product.priceCurrency || 'USD',
    availability: 'https://schema.org/InStock',
    seller: {
      '@type': 'Organization',
      name: 'FamilyBridge',
    },
  },
});

// AEO-optimized service schema for providers
export const createServiceSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'FamilyBridge Provider Platform',
  description: 'White-label recovery support platform for treatment centers, sober living facilities, and recovery professionals.',
  provider: {
    '@type': 'Organization',
    name: 'FamilyBridge',
  },
  serviceType: 'Recovery Support Software',
  areaServed: 'United States',
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Provider Subscriptions',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Provider Monthly Subscription',
          description: 'Create branded organization, unlimited families, AI insights',
        },
        price: '99.99',
        priceCurrency: 'USD',
      },
    ],
  },
});

// Speakable schema for voice search optimization
export const createSpeakableSchema = (selectors: string[]) => ({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  speakable: {
    '@type': 'SpeakableSpecification',
    cssSelector: selectors,
  },
});
