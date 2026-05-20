// Register the service worker for PWA functionality

const VAPID_PUBLIC_KEY = 'BJZQq6VWNmw-yMSdW5vhcn9JMvPSToGXMTsiwNaiYHj2BAcNw9Ai0zlEyvNMP8AGeRtCOz1ASi2hSvATV1ZpP_0';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function subscribeToPush(registration) {
  try {
    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    // Send subscription to server
    const token = localStorage.getItem('token');
    if (!token) return;

    const serverUrl = process.env.REACT_APP_SERVER_URL || '';
    await fetch(`${serverUrl}/api/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ subscription })
    });

    console.log('✅ Push notifications subscribed');
  } catch (err) {
    console.error('Push subscription failed:', err);
  }
}

export function register() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/sw.js`;

      navigator.serviceWorker.register(swUrl)
        .then((registration) => {
          console.log('✅ Service Worker registered:', registration.scope);

          // Subscribe to push after SW is active
          if (registration.active) {
            subscribeToPush(registration);
          } else {
            registration.addEventListener('updatefound', () => {
              const worker = registration.installing;
              if (!worker) return;
              worker.onstatechange = () => {
                if (worker.state === 'activated') {
                  subscribeToPush(registration);
                }
              };
            });
            // Also try when SW becomes active
            navigator.serviceWorker.ready.then(reg => subscribeToPush(reg));
          }

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
