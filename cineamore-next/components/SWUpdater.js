'use client';

import { useEffect } from 'react';

/**
 * Service Worker Updater
 * Forces a check for SW updates on mount and handles the update lifecycle.
 * This ensures users get the latest version (v3) which fixes the caching bugs.
 */
export default function SWUpdater() {
    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            // 1. Force update check immediately on mount
            navigator.serviceWorker.ready.then((registration) => {
                registration.update();
            });

            // 2. Listen for controller change (when new SW takes over)
            let refreshing = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (!refreshing) {
                    refreshing = true;
                    window.location.reload();
                }
            });
        }
    }, []);

    return null; // Invisible component
}
