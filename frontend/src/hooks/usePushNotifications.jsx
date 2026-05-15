import { useState, useEffect } from 'react';

export const usePushNotifications = () => {
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [subscription, setSubscription] = useState(null);

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            checkExistingSubscription();
        }
    }, []);

    const checkExistingSubscription = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const existingSub = await registration.pushManager.getSubscription();
            setSubscription(existingSub);
            setIsSubscribed(!!existingSub);
            
            // If subscription exists but not in backend, save it
            if (existingSub) {
                await saveSubscriptionToBackend(existingSub);
            }
        } catch (error) {
            console.error('Error checking subscription:', error);
        }
    };
    
   const saveSubscriptionToBackend = async (subscription) => {
    try {
        // ✅ Ensure we're sending the subscription as a JSON string
        const subscriptionString = JSON.stringify(subscription);
        
        const response = await fetch(`${import.meta.env.VITE_API_URL}/notifications/subscribe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ subscription: subscriptionString })
        });
        
        if (!response.ok) {
            throw new Error('Failed to save subscription');
        }
        console.log('✅ Subscription saved to backend');
    } catch (error) {
        console.error('Error saving subscription:', error);
    }
};

    const subscribe = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
            
            if (!vapidPublicKey) {
                console.error('VAPID public key is missing!');
                throw new Error('VAPID public key is missing');
            }
            
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
            });
            
            setSubscription(sub);
            setIsSubscribed(true);
            
            // Save to backend after successful subscription
            await saveSubscriptionToBackend(sub);
            
        } catch (error) {
            console.error('Subscribe error:', error);
            throw error;
        }
    };

    const unsubscribe = async () => {
        try {
            if (subscription) {
                await subscription.unsubscribe();
                setIsSubscribed(false);
                setSubscription(null);
                console.log('🔕 Unsubscribed from push notifications');
            }
        } catch (error) {
            console.error('Unsubscribe error:', error);
        }
    };

    return { isSupported, isSubscribed, subscribe, unsubscribe };
};

// Helper function: VAPID key conversion
function urlBase64ToUint8Array(base64String) {
    if (!base64String) {
        console.error('base64String is undefined or null');
        return new Uint8Array(0);
    }
    
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}