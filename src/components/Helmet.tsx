import React from 'react';
import { useLocation } from 'react-router-dom';

export const Helmet: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;
  
  // Default SEO values
  let title = "All-in-One Tools - Kumpulan Alat Online Gratis";
  let description = "Kumpulan alat online gratis untuk kebutuhan harian Anda. PDF, gambar, teks, dan banyak lagi.";
  
  // Update SEO values based on current route
  if (path !== '/') {
    // Remove leading slash and convert to title case
    const pageName = path.substring(1)
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    title = `${pageName} - Mastur Tools`;
    
    // Set specific descriptions for popular tools
    if (path === '/pdf-merger') {
      description = "Gabungkan beberapa file PDF menjadi satu dokumen dengan mudah dan gratis.";
    } else if (path === '/jpg-to-pdf') {
      description = "Konversi gambar JPG, PNG, dan format lainnya menjadi file PDF dengan cepat.";
    } else if (path === '/image-converter') {
      description = "Ubah format gambar dengan mudah: JPG, PNG, WEBP, dan lainnya.";
    } else if (path === '/text-counter') {
      description = "Hitung jumlah kata, karakter, dan paragraf dalam teks Anda secara real-time.";
    } else {
      description = `Tool online gratis untuk ${pageName.toLowerCase()} dengan mudah dan cepat.`;
    }
  }
  
  // Update document title and meta tags
  React.useEffect(() => {
    document.title = title;
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    }
    
    // Update Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', title);
    }
    
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', description);
    }
    
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) {
      ogUrl.setAttribute('content', `https://masturtools.netlify.app${path}`);
    }
    
    // Update Twitter tags
    const twitterTitle = document.querySelector('meta[property="twitter:title"]');
    if (twitterTitle) {
      twitterTitle.setAttribute('content', title);
    }
    
    const twitterDescription = document.querySelector('meta[property="twitter:description"]');
    if (twitterDescription) {
      twitterDescription.setAttribute('content', description);
    }
    
    const twitterUrl = document.querySelector('meta[property="twitter:url"]');
    if (twitterUrl) {
      twitterUrl.setAttribute('content', `https://masturtools.netlify.app${path}`);
    }
    
    // Update canonical link
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute('href', `https://masturtools.netlify.app${path}`);
    }
  }, [path, title, description]);
  
  return null;
};