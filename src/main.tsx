import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register service worker for reliable offline caching during school exhibitions
if ('serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onRegistered(registration) {
      if (registration) {
        console.log('[VIZLAB] Service Worker registered successfully at scope:', registration.scope);
      }
    },
    onRegisterError(error) {
      console.warn('[VIZLAB] Service Worker registration failed:', error);
    },
  });
}

createRoot(document.getElementById('root')!).render(<App />);
