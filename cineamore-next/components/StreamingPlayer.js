'use client';

import { useState } from 'react';

export default function StreamingPlayer({ tmdbId, title }) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    if (!tmdbId) return null;

    const embedUrl = `https://www.vidking.net/embed/movie/${tmdbId}?color=10b5cc`;

    return (
        <div className="w-full mt-10 animate-fade-in relative z-20 max-w-5xl mx-auto">
            {/* Minimalist Glass Header */}
            <div className="flex items-center gap-3 mb-6 px-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-lg w-fit">
                <div className="p-2 bg-[var(--accent)]/20 rounded-full">
                    <span className="text-[var(--accent)] text-lg leading-none">▶</span>
                </div>
                <h3 className="text-lg font-bold text-white tracking-wide">Streaming</h3>
            </div>

            <div className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden border border-white/5 shadow-[0_0_50px_-10px_rgba(var(--accent-rgb),0.3)] group hover:shadow-[0_0_80px_-10px_rgba(var(--accent-rgb),0.5)] transition-shadow duration-700">
                {/* Loading State */}
                {isLoading && !hasError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-10 pointer-events-none">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-[var(--muted)] text-sm font-medium">Loading Player...</span>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {hasError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-20">
                        <div className="text-center p-6">
                            <p className="text-red-400 font-bold mb-2">Stream Unavailable</p>
                            <p className="text-[var(--muted)] text-sm">Could not load the player for this title.</p>
                        </div>
                    </div>
                )}

                {/* VidKing Embed - Mobile Optimized */}
                {!hasError && (
                    <iframe
                        src={embedUrl}
                        className={`w-full h-full transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                        frameBorder="0"
                        allow="autoplay; fullscreen; picture-in-picture"
                        playsInline
                        webkit-playsinline="true"
                        allowFullScreen
                        onLoad={() => setIsLoading(false)}
                        onError={() => setHasError(true)}
                        title={`Stream ${title}`}
                    />
                )}
            </div>

            {/* Disclaimer removed for minimalist look */}
        </div>
    );
}
