import React from 'react';
import { Bell, BellOff } from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { toast } from 'react-toastify';

const NotificationToggle = () => {
    const { isSupported, isSubscribed, subscribe, unsubscribe } = usePushNotifications();

    const handleToggle = async () => {
        if (isSubscribed) {
            await unsubscribe();
            toast.info('Notifications disabled');
        } else {
            await subscribe();
            toast.success('Notifications enabled');
        }
    };

    if (!isSupported) return null;

    return (
        <button
            onClick={handleToggle}
            className={`p-2 rounded-xl transition-colors ${
                isSubscribed 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-gray-100 text-gray-600'
            }`}
            title={isSubscribed ? 'Disable notifications' : 'Enable notifications'}
        >
            {isSubscribed ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
        </button>
    );
};

export default NotificationToggle;