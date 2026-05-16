self.addEventListener('push', function(event) {
    let data = {};
    
    try {
        data = event.data.json();
    } catch (e) {
        data = {
            title: 'Mess Manager',
            body: 'আপনার মিল কনফার্মেশন প্রয়োজন!',
            url: '/direct-confirmation',
            meal_type: 'lunch',
            date: new Date().toISOString().split('T')[0]
        };
    }
    
    const options = {
        body: data.body || 'আপনার মিল কনফার্মেশন প্রয়োজন!',
        icon: '/logo192.png',
        // badge: '/badge.png',
        vibrate: [300, 100, 200, 100, 300],
        data: {
            url: data.url || '/direct-confirmation',
            meal_type: data.meal_type,
            date: data.date
        }
        // ❌ No 'actions' - remove Yes/No buttons completely
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Mess Manager', options)
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    
    const notificationData = event.notification.data;
    
    // Just open the confirmation page - user will select Yes/No there
    const url = `/direct-confirmation?type=${notificationData.meal_type}&date=${notificationData.date}`;
    console.log('📱 Opening confirmation page:', url);
    
    event.waitUntil(
        clients.openWindow(url)
    );
});