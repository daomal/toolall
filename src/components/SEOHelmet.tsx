import React from 'react';

interface SEOHelmetProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogImage?: string;
  keywords?: string;
}

const SEOHelmet: React.FC<SEOHelmetProps> = ({
  title,
  description,
  canonicalUrl = 'https://masturtools.netlify.app/',
  ogImage = 'https://masturtools.netlify.app/og-image.jpg',
  keywords = 'alat online, tools online, pdf merger, konverter gambar, kalkulator, alat produktivitas, alat gratis',
}) => {
  // Dynamically update document title
  React.useEffect(() => {
    document.title = `${title} - Mastur Tools`;
    
    // Update meta tags
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    }
    
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', keywords);
    }
    
    // Update Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', `${title} - Mastur Tools`);
    }
    
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', description);
    }
    
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) {
      ogUrl.setAttribute('content', canonicalUrl);
    }
    
    const ogImageTag = document.querySelector('meta[property="og:image"]');
    if (ogImageTag) {
      ogImageTag.setAttribute('content', ogImage);
    }
    
    // Update Twitter tags
    const twitterTitle = document.querySelector('meta[property="twitter:title"]');
    if (twitterTitle) {
      twitterTitle.setAttribute('content', `${title} - Mastur Tools`);
    }
    
    const twitterDescription = document.querySelector('meta[property="twitter:description"]');
    if (twitterDescription) {
      twitterDescription.setAttribute('content', description);
    }
    
    const twitterUrl = document.querySelector('meta[property="twitter:url"]');
    if (twitterUrl) {
      twitterUrl.setAttribute('content', canonicalUrl);
    }
    
    const twitterImage = document.querySelector('meta[property="twitter:image"]');
    if (twitterImage) {
      twitterImage.setAttribute('content', ogImage);
    }
    
    // Update canonical link
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute('href', canonicalUrl);
    }
  }, [title, description, canonicalUrl, ogImage, keywords]);
  
  return null;
};

export default SEOHelmet;