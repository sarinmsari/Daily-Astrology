self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through fetch for now, satisfying PWA install criteria
  // without interfering with Next.js App Router dynamic routes.
});

// ─── Web Push Notification Delivery Listener ──────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body || "Your daily astrology reading is aligned.",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: {
        url: data.url // Page to open when notification is clicked
      },
      actions: [
        { action: 'open', title: 'See Reading' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || "Daily Astrology", options)
    );
  } catch (err) {
    console.error("Error parsing push notification payload:", err);
  }
});

// ─── Push Notification Click Banner Listener ──────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const destinationUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If window is already open, focus it and redirect
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus().then((focusedClient) => focusedClient.navigate(destinationUrl));
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow(destinationUrl);
      }
    })
  );
});
