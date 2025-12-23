'use client';

import { useEffect } from 'react';

/**
 * Global Error Boundary for the Main App Segment
 * Catches client-side errors in page.js and children.
 */
export default function Error({ error, reset }) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Captured App Error:', error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 bg-[var(--bg)] text-[var(--fg)]">
            <div className="bg-[var(--card-bg)] border border-[var(--border)] p-8 rounded-2xl shadow-2xl max-w-md w-full backdrop-blur-xl">
                <div className="text-6xl mb-4">😵</div>
                <h2 className="text-2xl font-bold mb-2">Something went wrong!</h2>
                <p className="text-[var(--muted)] mb-6 text-sm">
                    {error.message || "We encountered an unexpected error rendering this page."}
                </p>
                <div className="flex gap-4 justify-center">
                    <button
                        onClick={() => reset()}
                        className="px-6 py-2 bg-[var(--accent)] text-black font-bold rounded-full hover:scale-105 transition-transform"
                    >
                        Try Again
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors"
                    >
                        Reload Page
                    </button>
                </div>
            </div>
        </div>
    );
}
