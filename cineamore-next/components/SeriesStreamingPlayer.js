'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { STREAMING_PROVIDERS, getProviderById, constructTVEmbedUrl } from '@/lib/streamingProviders';

export default function SeriesStreamingPlayer({ tmdbId, title, season = 1, episode = 1, onProgress }) {
    const [activeProviderId, setActiveProviderId] = useState('alpha');
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [currentProgress, setCurrentProgress] = useState(0);
    const iframeRef = useRef(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Reset loading state when episode changes (but keep selected provider)
    useEffect(() => {
        setIsLoading(true);
        setHasError(false);
    }, [season, episode]);

    const handleProviderChange = useCallback((providerId) => {
        setActiveProviderId(providerId);
        setIsLoading(true);
        setHasError(false);
        setIsDropdownOpen(false);
    }, []);

    // Progress tracking via postMessage (VidKing only)
    useEffect(() => {
        const handleMessage = (event) => {
            if (!event.origin.includes('vidking')) return;

            try {
                const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

                if (data && typeof data.progress === 'number') {
                    setCurrentProgress(data.progress);

                    // Save to localStorage for resume functionality
                    if (tmdbId) {
                        localStorage.setItem(`series_progress_${tmdbId}_${season}_${episode}`, JSON.stringify({
                            progress: data.progress,
                            timestamp: Date.now()
                        }));
                    }

                    if (onProgress) {
                        onProgress(data.progress);
                    }
                }
            } catch (e) {
                // Ignore non-JSON messages
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [tmdbId, season, episode, onProgress]);

    // Get saved progress for resume (VidKing only)
    const getSavedProgress = () => {
        if (!tmdbId || activeProviderId !== 'alpha') return 0;
        try {
            const saved = localStorage.getItem(`series_progress_${tmdbId}_${season}_${episode}`);
            if (saved) {
                const { progress, timestamp } = JSON.parse(saved);
                if (Date.now() - timestamp < 7 * 24 * 60 * 60 * 1000) {
                    return Math.floor(progress);
                }
            }
        } catch (e) { }
        return 0;
    };

    if (!tmdbId) return null;

    const currentProvider = getProviderById(activeProviderId);
    const savedProgress = getSavedProgress();

    // Construct TV embed URL
    let embedUrl = constructTVEmbedUrl(activeProviderId, tmdbId, season, episode);

    // Add progress resume for VidKing only
    if (activeProviderId === 'alpha' && savedProgress > 60) {
        embedUrl += `&progress=${savedProgress}`;
    }

    return (
        <div className="w-full mt-6 animate-fade-in relative z-20 max-w-5xl mx-auto">
            {/* Header with Provider Dropdown */}
            <div className="relative z-50 flex flex-wrap items-center gap-3 mb-6 px-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-lg w-fit">
                <div className="p-2 bg-orange-600/20 rounded-full">
                    <span className="text-orange-400 text-lg leading-none">▶</span>
                </div>
                <h3 className="text-lg font-bold text-white tracking-wide hidden sm:block">
                    Season {season} • Episode {episode}
                </h3>
                {savedProgress > 60 && activeProviderId === 'alpha' && (
                    <span className="text-xs bg-orange-600/20 text-orange-400 px-2 py-1 rounded-full">
                        Resuming from {Math.floor(savedProgress / 60)}m
                    </span>
                )}

                {/* Source Selector Dropdown */}
                <div className="relative ml-2">
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-sm font-medium text-white border border-white/5"
                    >
                        <span className="text-orange-400/80">Source:</span>
                        <span>{currentProvider.name}</span>
                        <svg className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                        className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between
                                            ${activeProviderId === provider.id
                                                ? 'bg-orange-600/20 text-orange-400'
                                                : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                            }`}
                                    >
                                        <span>{provider.name}</span>
                                        {activeProviderId === provider.id && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(234,88,12,0.5)]"></span>
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

            <div className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden border border-white/5 shadow-[0_0_50px_-10px_rgba(168,85,247,0.3)] group hover:shadow-[0_0_80px_-10px_rgba(168,85,247,0.5)] transition-shadow duration-700">
                {/* Loading State */}
                {isLoading && !hasError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-10 pointer-events-none">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-[var(--muted)] text-sm font-medium">Loading {currentProvider.name}...</span>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {hasError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-20">
                        <div className="text-center p-6">
                            <p className="text-red-400 font-bold mb-2">Stream Unavailable</p>
                            <p className="text-[var(--muted)] text-sm">Could not load this episode.</p>
                        </div>
                    </div>
                )}

                {/* Series Embed */}
                {!hasError && (
                    <iframe
                        ref={iframeRef}
                        src={embedUrl}
                        key={embedUrl}
                        className={`w-full h-full transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                        frameBorder="0"
                        allow="autoplay; fullscreen; picture-in-picture"
                        playsInline
                        webkit-playsinline="true"
                        allowFullScreen
                        onLoad={() => setIsLoading(false)}
                        onError={() => setHasError(true)}
                        title={`Stream ${title} S${season}E${episode}`}
                    />
                )}
            </div>

            {/* Progress Indicator (VidKing only) */}
            {currentProgress > 0 && activeProviderId === 'alpha' && (
                <div className="mt-4 text-xs text-[var(--muted)] text-center">
                    Progress saved: {Math.floor(currentProgress / 60)}m {Math.floor(currentProgress % 60)}s
                </div>
            )}
        </div>
    );
}
