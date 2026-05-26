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
      // If an app window is already open, focus it.
      // We do NOT call client.navigate() here because on many mobile browsers
      // focus() returns a base Client (not WindowClient), which has no .navigate() method —
      // causing a silent crash that prevents any navigation from happening.
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus().then((focusedClient) => {
            // Only navigate if the method is actually available (WindowClient).
            if (focusedClient && typeof focusedClient.navigate === 'function') {
              return focusedClient.navigate(destinationUrl);
            }
            // Fallback: open a fresh window to the destination.
            return clients.openWindow(destinationUrl);
          });
        }
      }
      // No window open — open a new one.
      if (clients.openWindow) {
        return clients.openWindow(destinationUrl);
      }
    })
  );
});
