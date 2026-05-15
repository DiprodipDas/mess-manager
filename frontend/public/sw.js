self.addEventListener('push', function(event) {
    const data = event.data.json();
    
    const options = {
        body: data.body || 'আপনার মিল কনফার্মেশন প্রয়োজন!',
        icon: '/logo192.png',
        badge: '/badge.png',
        vibrate: [200, 100, 200],
        data: {
            url: data.url || '/meal-confirmation'
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Mess Manager', options)
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    const urlToOpen = event.notification.data.url;
    event.waitUntil(
        clients.openWindow(urlToOpen)
    );
});