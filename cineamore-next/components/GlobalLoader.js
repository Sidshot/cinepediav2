'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function GlobalLoader() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);

    // Delay threshold in ms. 
    // If loading takes less than this, user sees nothing (smooth).
    // If more, they see the loader.
    const DELAY_MS = 300;

    const timerRef = useRef(null);

    useEffect(() => {
        // Stop loading immediately when path changes (navigation complete)
        if (timerRef.current) clearTimeout(timerRef.current);
        setIsLoading(false);
    }, [pathname, searchParams]);

    useEffect(() => {
        const handleStart = () => {
            if (timerRef.current) clearTimeout(timerRef.current); // Clear any existing timer

            // Only show loader if it takes longer than DELAY_MS
            timerRef.current = setTimeout(() => {
                setIsLoading(true);
            }, DELAY_MS);
        };

        const handleStop = () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            setIsLoading(false);
        };

        window.addEventListener('start-loading', handleStart);
        window.addEventListener('stop-loading', handleStop);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            window.removeEventListener('start-loading', handleStart);
            window.removeEventListener('stop-loading', handleStop);
        };
    }, []);

    // Safety: Auto-dismiss loader if it hangs for more than 5 seconds
    // This handles cases where navigation crashes or stalls indefinitely
    useEffect(() => {
        let safetyTimer;
        if (isLoading) {
            safetyTimer = setTimeout(() => {
                setIsLoading(false);
            }, 5000);
        }
        return () => clearTimeout(safetyTimer);
    }, [isLoading]);

    if (!isLoading) return null;

    return (
        <div
            // Allow user to click anywhere to force dismiss (Escape hatch)
            onClick={() => setIsLoading(false)}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
            title="Click to cancel loading"
        >
            <div className="flex flex-col items-center gap-4 pointer-events-none">
                {/* Logo Spinner */}
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-white/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-t-[var(--accent)] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                </div>
                <div className="text-white font-medium tracking-wider animate-pulse">LOADING...</div>
                <div className="text-white/50 text-xs mt-2">(Click to dismiss)</div>
            </div>
        </div>
    );
}
