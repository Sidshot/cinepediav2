'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { STREAMING_PROVIDERS, getProviderById, constructEmbedUrl } from '@/lib/streamingProviders';

export default function StreamingPlayer({ tmdbId, title, onProgress }) {
    const [activeProviderId, setActiveProviderId] = useState('alpha');
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const iframeRef = useRef(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Reset when movie changes
    useEffect(() => {
        setActiveProviderId('alpha');
        setIsLoading(true);
        setHasError(false);
    }, [tmdbId]);

    const handleProviderChange = useCallback((providerId) => {
        setActiveProviderId(providerId);
        setIsLoading(true);
        setHasError(false);
        setIsDropdownOpen(false);
    }, []);

    // Progress tracking for VidKing only (optional - for resume feature)
    useEffect(() => {
        if (activeProviderId !== 'alpha') return;

        const handleMessage = (event) => {
            if (!event.origin.includes('vidking')) return;

            try {
                const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

                // VidKing "PLAYER_EVENT" structure
                if (data?.type === 'PLAYER_EVENT' && data.data?.event === 'timeupdate') {
                    if (onProgress && data.data.progress) {
                        onProgress(data.data.progress);
                    }
                }
            } catch (e) { }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [activeProviderId, onProgress]);

    if (!tmdbId) return null;

    const currentProvider = getProviderById(activeProviderId);

    // Construct the embed URL using the helper
    const embedUrl = constructEmbedUrl(activeProviderId, tmdbId);

    return (
        <div className="w-full mt-10 animate-fade-in relative z-20 mx-auto">
            {/* AD WARNING BANNER */}
            <div className="mb-6 bg-gradient-to-r from-orange-600/20 to-red-600/20 border-2 border-orange-500/40 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                    <div className="text-2xl flex-shrink-0">⚠️</div>
                    <div className="space-y-1">
                        <h3 className="text-orange-400 font-bold text-lg">Third-Party Streaming Notice</h3>
                        <p className="text-white text-sm leading-relaxed">
                            This streaming service is provided by third-party integrations and <span className="font-bold text-orange-300">may contain ads</span> that are beyond our control.
                        </p>
                        <p className="text-orange-200 font-semibold text-sm mt-2 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                            </svg>
                            RECOMMENDED: Use an adblocker for the best experience
                        </p>
                    </div>
                </div>
            </div>

            {/* Minimalist Glass Header with Source Selector */}
            <div className="relative z-50 flex items-center gap-3 mb-6 px-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-lg w-fit">
                <div className="p-2 bg-yellow-500/20 rounded-full">
                    <span className="text-yellow-400 text-lg leading-none">▶</span>
                </div>

                <h3 className="text-lg font-bold text-white tracking-wide hidden sm:block">Streaming</h3>

                {/* Source Selector Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-200 text-sm font-medium text-white border border-white/10 active:scale-95"
                    >
                        <span className="text-yellow-400/80 text-xs">Source:</span>
                        <span className="font-semibold">{currentProvider.name}</span>
                        <svg className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {/* Dropdown Menu - Pill Shaped Options */}
                    {isDropdownOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                            <div className="absolute top-full right-0 mt-3 min-w-[200px] p-2 bg-[#0a0a0a]/98 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 max-h-96 overflow-y-auto">
                                {STREAMING_PROVIDERS.map((provider) => (
                                    <button
                                        key={provider.id}
                                        onClick={() => handleProviderChange(provider.id)}
                                        className={`w-full text-left px-4 py-3 mb-1.5 last:mb-0 rounded-full text-sm font-medium transition-all duration-200 flex items-center justify-between active:scale-95
                                            ${activeProviderId === provider.id
                                                ? 'bg-yellow-500/20 text-yellow-400 shadow-[0_0_20px_-5px_rgba(234,179,8,0.3)]'
                                                : 'text-gray-300 hover:bg-white/10 hover:text-white'
                                            }`}
                                    >
                                        <span>{provider.name}</span>
                                        {activeProviderId === provider.id && (
                                            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className="text-xs text-gray-400/70 ml-4 hidden md:block">
                    If player fails, try another source
                </div>
            </div>

            {/* Player Container - Responsive Aspect Ratio */}
            <div className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden border border-white/5 shadow-[0_0_50px_-10px_rgba(251,191,36,0.3)] group hover:shadow-[0_0_80px_-10px_rgba(251,191,36,0.5)] transition-shadow duration-700">
                {/* Loading State */}
                {isLoading && !hasError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-10 pointer-events-none">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-[var(--muted)] text-sm font-medium">Loading {currentProvider.name}...</span>
                        </div>
                    </div>
                )}

                {/* Iframe */}
                <iframe
                    ref={iframeRef}
                    src={embedUrl}
                    key={embedUrl} // Force re-render on url change
                    referrerPolicy="no-referrer"
                    className={`w-full h-full transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                    frameBorder="0"
                    allow="autoplay *; fullscreen *; picture-in-picture *; encrypted-media *; gyroscope; accelerometer; clipboard-write"
                    allowFullScreen
                    onLoad={() => setIsLoading(false)}
                    title={`Stream ${title}`}
                />
            </div>
        </div>
    );
}
