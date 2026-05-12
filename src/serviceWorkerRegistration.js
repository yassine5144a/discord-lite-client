// Register the service worker for PWA functionality

export function register() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/sw.js`;

      navigator.serviceWorker.register(swUrl)
        .then((registration) => {
          console.log('✅ Service Worker registered:', registration.scope);

          // Check for updates
          registration.onupdatefound = () => {
            const worker = registration.installing;
            if (!worker) return;
            worker.onstatechange = () => {
              if (worker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('🔄 New version available - refresh to update');
              }
            };
          };
        })
        .catch((err) => {
          console.error('Service Worker registration failed:', err);
        });
    });
  }
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => registration.unregister())
      .catch(console.error);
  }
}
