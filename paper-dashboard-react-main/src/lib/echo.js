// src/lib/echo.js
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

let echoInstance = null;

export const getEcho = () => {
    if (echoInstance) {
        return echoInstance;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
        console.warn('⚠️ No access_token found in localStorage');
        return null;
    }

    const pusherKey = 'caa0b3a54bbb24eb22fa';
    const pusherCluster = 'eu';

    if (!pusherKey) {
        console.error('❌ PUSHER_APP_KEY is not defined in environment variables');
        return null;
    }

    console.log('🔧 Initializing Echo with:', {
        key: pusherKey?.substring(0, 10) + '...',
        cluster: pusherCluster,
        hasToken: !!token
    });

    try {
        echoInstance = new Echo({
            broadcaster: 'pusher',
            key: pusherKey,
            cluster: pusherCluster || 'eu',
            forceTLS: true,
            encrypted: true,

            // تأكد من أن authEndpoint مضبوط بشكل صحيح
            // authEndpoint: `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/broadcasting/auth`,
            // auth: {
            //     headers: {
            //         'Authorization': `Bearer ${token}`,
            //         'Accept': 'application/json',
            //         // 'Content-Type': 'application/json'
            //     }
            // }
        });

        // إضافة مستمعين للاتصال
        if (echoInstance.connector && echoInstance.connector.pusher) {
            const pusher = echoInstance.connector.pusher;

            pusher.connection.bind('connecting', () => {
                console.log('🔄 Connecting to Pusher...');
            });

            pusher.connection.bind('connected', () => {
                console.log('✅ Pusher connected successfully!');
            });

            pusher.connection.bind('disconnected', () => {
                console.warn('❌ Pusher disconnected');
            });

            pusher.connection.bind('error', (error) => {
                console.error('❌ Pusher error:', error);
            });
        }

        console.log('🎉 Echo initialized successfully');
        return echoInstance;

    } catch (error) {
        console.error('❌ Failed to initialize Echo:', error);
        return null;
    }
};

export const leaveChannel = (channelName) => {
    if (echoInstance) {
        try {
            echoInstance.leave(channelName);
            console.log(`👋 Left channel: ${channelName}`);
        } catch (error) {
            console.error(`❌ Error leaving channel ${channelName}:`, error);
        }
    }
};

export const disconnectEcho = () => {
    if (echoInstance) {
        echoInstance.disconnect();
        echoInstance = null;
        console.log('🔌 Echo disconnected');
    }
};