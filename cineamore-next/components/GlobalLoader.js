'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function GlobalLoader() {
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(false);

    // Delay threshold in ms. 
    // If loading takes less than this, user sees nothing (smooth).
    // If more, they see the loader.
    const DELAY_MS = 400;

    const timerRef = useRef(null);

    useEffect(() => {
        // Stop loading immediately when path changes (navigation complete)
        if (timerRef.current) clearTimeout(timerRef.current);
        setIsLoading(false);
    }, [pathname]);

    useEffect(() => {
        const handleStart = () => {
            if (timerRef.current) clearTimeout(timerRef.current);

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

    // Safety: Auto-dismiss loader if it hangs for more than 3 seconds
    useEffect(() => {
        let safetyTimer;
        if (isLoading) {
            safetyTimer = setTimeout(() => {
                setIsLoading(false);
            }, 3000); // Reduced from 5s to 3s
        }
        return () => clearTimeout(safetyTimer);
    }, [isLoading]);

    if (!isLoading) return null;

    // Cinephile-friendly loading phrases
    const phrases = [
        'CURATING',
        'NOW SHOWING',
        'ROLLING',
        'REELING'
    ];
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];

    return (
        <div
            onClick={() => setIsLoading(false)}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm cursor-pointer"
        >
            <div className="flex flex-col items-center gap-4 pointer-events-none">
                {/* Minimal spinner */}
                <div className="w-6 h-6 border border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>

                {/* Cinephile phrase */}
                <div className="text-white/60 text-[10px] font-mono tracking-[0.4em] uppercase">
                    {phrase}
                </div>
            </div>
        </div>
    );
}
