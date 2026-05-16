// public/sw.js

// 1. Listen for background payload signals forwarded by the Go service
self.addEventListener('push', (event) => {
  if (!event.data) return;

  // Extract the encrypted JSON object
  const data = event.data.json();

  const options = {
    body: data.body,
    icon: data.icon || '/logo192.png',
    tag: 'pulsechat-offline-alert', // Merges duplicate message clusters cleanly
    vibrate: [100, 50, 100],
    data: {
      url: '/' // Target window context URL route on user click
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 2. Handle user click actions on the native desktop notification card
self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // Dismiss the notification card instantly

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a browser window tab is already running open, focus on it
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // If no dashboard tab is found active, fire up a fresh one
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});
