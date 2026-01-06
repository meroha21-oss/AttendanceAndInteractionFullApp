import { useState, useEffect, useCallback, useRef } from 'react';

export const useActivityTracker = (onInactivityWarning, onInactivityTimeout) => {
    const [lastActivity, setLastActivity] = useState(Date.now());
    const [warningShown, setWarningShown] = useState(false);
    const [timeoutShown, setTimeoutShown] = useState(false);
    const activityTimeoutRef = useRef(null);
    const countdownRef = useRef(null);
    const [countdown, setCountdown] = useState(120); // 2 minutes countdown

    // Track user activity
    const trackActivity = useCallback(() => {
        setLastActivity(Date.now());
        if (warningShown) {
            setWarningShown(false);
            if (activityTimeoutRef.current) {
                clearTimeout(activityTimeoutRef.current);
                activityTimeoutRef.current = null;
            }
            if (countdownRef.current) {
                clearInterval(countdownRef.current);
                countdownRef.current = null;
            }
            setCountdown(120);
        }
    }, [warningShown]);

    useEffect(() => {
        // Add event listeners for activity
        const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart', 'mousedown'];

        const handleActivity = () => {
            trackActivity();
        };

        events.forEach(event => {
            window.addEventListener(event, handleActivity);
        });

        // Check inactivity every 30 seconds
        const checkInterval = setInterval(() => {
            const now = Date.now();
            const secondsInactive = Math.floor((now - lastActivity) / 1000);

            if (secondsInactive >= 600 && !timeoutShown) { // 10 minutes
                // 10 minutes - timeout
                setTimeoutShown(true);
                if (onInactivityTimeout) {
                    onInactivityTimeout();
                }
            } else if (secondsInactive >= 480 && !warningShown && !timeoutShown) { // 8 minutes
                // 8 minutes - warning
                setWarningShown(true);
                if (onInactivityWarning) {
                    onInactivityWarning();
                }

                // Start countdown for remaining 2 minutes
                if (!activityTimeoutRef.current) {
                    activityTimeoutRef.current = setTimeout(() => {
                        if (onInactivityTimeout) {
                            onInactivityTimeout();
                        }
                        setTimeoutShown(true);
                    }, 120000); // 2 minutes
                }

                // Start countdown timer
                if (!countdownRef.current) {
                    setCountdown(120);
                    countdownRef.current = setInterval(() => {
                        setCountdown(prev => {
                            if (prev <= 1) {
                                clearInterval(countdownRef.current);
                                countdownRef.current = null;
                                return 0;
                            }
                            return prev - 1;
                        });
                    }, 1000);
                }
            }
        }, 30000); // Check every 30 seconds

        return () => {
            // Cleanup
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
            clearInterval(checkInterval);
            if (activityTimeoutRef.current) {
                clearTimeout(activityTimeoutRef.current);
            }
            if (countdownRef.current) {
                clearInterval(countdownRef.current);
            }
        };
    }, [lastActivity, warningShown, timeoutShown, trackActivity, onInactivityWarning, onInactivityTimeout]);

    return {
        trackActivity,
        warningShown,
        countdown,
        resetWarning: () => {
            setWarningShown(false);
            if (activityTimeoutRef.current) {
                clearTimeout(activityTimeoutRef.current);
                activityTimeoutRef.current = null;
            }
            if (countdownRef.current) {
                clearInterval(countdownRef.current);
                countdownRef.current = null;
            }
            setCountdown(120);
        }
    };
};