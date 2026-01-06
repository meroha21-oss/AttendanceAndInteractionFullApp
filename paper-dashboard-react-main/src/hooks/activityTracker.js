import { useState, useEffect, useCallback } from 'react';

export const useActivityTracker = (onInactivityWarning, onInactivityTimeout) => {
    const [lastActivity, setLastActivity] = useState(Date.now());
    const [warningShown, setWarningShown] = useState(false);
    const [timeoutShown, setTimeoutShown] = useState(false);

    // Track user activity
    const trackActivity = useCallback(() => {
        setLastActivity(Date.now());
        if (warningShown) {
            setWarningShown(false);
        }
    }, [warningShown]);

    useEffect(() => {
        // Add event listeners for activity
        const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

        events.forEach(event => {
            window.addEventListener(event, trackActivity);
        });

        // Check inactivity every minute
        const interval = setInterval(() => {
            const now = Date.now();
            const minutesInactive = Math.floor((now - lastActivity) / 60000);

            if (minutesInactive >= 10 && !timeoutShown) {
                // 10 minutes - timeout
                setTimeoutShown(true);
                onInactivityTimeout();
            } else if (minutesInactive >= 8 && !warningShown && !timeoutShown) {
                // 8 minutes - warning
                setWarningShown(true);
                onInactivityWarning();
            }
        }, 60000); // Check every minute

        return () => {
            // Cleanup
            events.forEach(event => {
                window.removeEventListener(event, trackActivity);
            });
            clearInterval(interval);
        };
    }, [lastActivity, warningShown, timeoutShown, trackActivity, onInactivityWarning, onInactivityTimeout]);

    return { trackActivity };
};