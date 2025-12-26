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
            {/* Minimalist Glass Header with Source Selector - Added z-50 to fix dropdown clipping */}
            <div className="relative z-50 flex flex-wrap items-center gap-3 mb-6 px-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-lg w-fit">
                <div className="p-2 bg-yellow-500/20 rounded-full">
                    <span className="text-yellow-400 text-lg leading-none">▶</span>
                </div>

                <h3 className="text-lg font-bold text-white tracking-wide hidden sm:block">Streaming</h3>

                {/* Source Selector Dropdown */}
                <div className="relative ml-2">
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-sm font-medium text-white border border-white/5"
                    >
                        <span className="text-yellow-400/80">Source:</span>
                        <span>{currentProvider.name}</span>
                        <svg className={`w - 4 h - 4 transition - transform ${isDropdownOpen ? 'rotate-180' : ''} `} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                            <div className="absolute top-full left-0 mt-2 w-48 py-2 bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto custom-scrollbar">
                                {STREAMING_PROVIDERS.map((provider) => (
                                    <button
                                        key={provider.id}
                                        onClick={() => handleProviderChange(provider.id)}
                                        className={`w - full text - left px - 4 py - 2 text - sm transition - colors flex items - center justify - between
                                            ${activeProviderId === provider.id
                                                ? 'bg-yellow-500/20 text-yellow-400'
                                                : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                            } `}
                                    >
                                        <span>{provider.name}</span>
                                        {activeProviderId === provider.id && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]"></span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className="text-xs text-[var(--muted)] ml-auto sm:ml-2">
                    If player fails, try another source.
                </div>
            </div>

            <div className="relative w-full bg-black rounded-3xl overflow-hidden border border-white/5 shadow-[0_0_50px_-10px_rgba(251,191,36,0.3)] group hover:shadow-[0_0_80px_-10px_rgba(251,191,36,0.5)] transition-shadow duration-700" style={{ height: 'calc(100vh - 200px)', minHeight: '600px' }}>
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
                    className={`w-full h-full transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    onLoad={() => setIsLoading(false)}
                    title={`Stream ${title}`}
                />
            </div>
        </div>
    );
}
