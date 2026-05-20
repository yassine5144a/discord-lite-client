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

// Called after user logs in — subscribes to push and saves to server
export async function subscribeToPush() {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    const token = localStorage.getItem('dl_token');
    if (!token) return;

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const registration = await navigator.serviceWorker.ready;

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
    }

    // Send subscription to server
    const serverUrl = process.env.REACT_APP_SERVER_URL || '';
    const res = await fetch(`${serverUrl}/api/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ subscription })
    });

    if (res.ok) {
      console.log('✅ Push notifications subscribed');
    }
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

          // If user is already logged in, subscribe immediately
          const token = localStorage.getItem('dl_token');
          if (token) {
            navigator.serviceWorker.ready.then(() => subscribeToPush());
          }

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
