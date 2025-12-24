'use client';

import { useState } from 'react';

export default function StreamingPlayer({ tmdbId, title }) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    if (!tmdbId) return null;

    const embedUrl = `https://www.vidking.net/embed/movie/${tmdbId}?color=10b5cc`;

    return (
        <div className="w-full mt-10 animate-fade-in relative z-20 max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-6 px-4 py-3 bg-gradient-to-r from-[var(--accent)]/10 to-transparent border-l-4 border-[var(--accent)] rounded-r-xl">
                <div className="p-2 bg-[var(--accent)]/20 rounded-full animate-pulse-slow">
                    <span className="text-[var(--accent)] text-xl leading-none">▶</span>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">Streaming</h3>
                    <p className="text-xs text-[var(--muted)] opacity-80">High-speed plyr • Ad-Blocker Recommended context</p>
                </div>
            </div>

            <div className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden border border-white/5 shadow-[0_0_50px_-10px_rgba(var(--accent-rgb),0.3)] group hover:shadow-[0_0_80px_-10px_rgba(var(--accent-rgb),0.5)] transition-shadow duration-700">
                {/* Loading State */}
                {isLoading && !hasError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-10">
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

                {/* VidKing Embed */}
                {!hasError && (
                    <iframe
                        src={embedUrl}
                        className={`w-full h-full transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                        frameBorder="0"
                        allow="fullscreen; picture-in-picture"
                        allowFullScreen
                        onLoad={() => setIsLoading(false)}
                        onError={() => setHasError(true)}
                        title={`Stream ${title}`}
                    />
                )}
            </div>

            <p className="text-center text-xs text-[var(--muted)] mt-3 opacity-60">
                Streaming functionality provided by third-party. Use an ad-blocker for best experience.
            </p>
        </div>
    );
}
