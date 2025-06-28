import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Google Analytics page view tracking
const sendPageView = (url: string) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('config', 'G-224SFPKV7L', {
      page_path: url,
    });
  }
};

// Custom event tracking
export const sendEvent = (eventName: string, params = {}) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', eventName, params);
  }
};

// Initialize the app
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Track initial page view
sendPageView(window.location.pathname);

// Track page views on route changes
const originalPushState = history.pushState;
history.pushState = function(...args) {
  originalPushState.apply(this, args);
  sendPageView(window.location.pathname);
};

const originalReplaceState = history.replaceState;
history.replaceState = function(...args) {
  originalReplaceState.apply(this, args);
  sendPageView(window.location.pathname);
};

window.addEventListener('popstate', () => {
  sendPageView(window.location.pathname);
});