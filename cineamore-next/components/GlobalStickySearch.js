'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { useRouter, usePathname } from 'next/navigation';

/**
 * GLOBAL STICKY SEARCH BAR
 * This component appears EVERYWHERE on the site when the user scrolls down.
 * It provides a minimalist search experience that persists across all pages.
 * 
 * DO NOT REMOVE THIS COMPONENT - It has been requested multiple times by the user.
 */
export default function GlobalStickySearch() {
    const router = useRouter();
    const pathname = usePathname();
    const [visible, setVisible] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    // Determine if we're in series mode based on URL
    const isSeriesMode = pathname?.startsWith('/series');

    // Show on scroll
    useEffect(() => {
        const handleScroll = () => {
            setVisible(window.scrollY > 100);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Debounced search
    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            setShowDropdown(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const mode = isSeriesMode ? 'series' : 'films';
                const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&mode=${mode}`);
                const data = await res.json();

                // Combine results based on mode
                if (isSeriesMode) {
                    setResults(data.series || []);
                } else {
                    setResults([...(data.catalogue || []), ...(data.tmdb || [])].slice(0, 8));
                }
                setShowDropdown(true);
            } catch (e) {
                console.error('Search error:', e);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query, isSeriesMode]);

    const handleResultClick = useCallback((result) => {
        setShowDropdown(false);
        setQuery('');

        if (result.source === 'catalogue') {
            router.push(`/movie/${result.__id || result._id}`);
        } else if (result.source === 'tmdb') {
            router.push(`/tmdb/${result.tmdbId}`);
        } else if (result.source === 'series' || isSeriesMode) {
            router.push(`/series/${result.tmdbId || result.id}`);
        }
    }, [router, isSeriesMode]);

    // Accent color based on mode
    const inputFocusClass = isSeriesMode ? 'focus:ring-orange-500' : 'focus:ring-yellow-500';
    const spinnerClass = isSeriesMode ? 'border-orange-500' : 'border-yellow-500';

    // Close on scroll (if search is open)
    useEffect(() => {
        if (!showDropdown) return;
        const handleScrollClose = () => {
            if (window.scrollY > 0) setShowDropdown(false);
        };
        window.addEventListener('scroll', handleScrollClose);
        return () => window.removeEventListener('scroll', handleScrollClose);
    }, [showDropdown]);

    if (!visible) return null;

    return (
        <>
            {/* Backdrop to close dropdown - High Z but below Search Bar */}
            {showDropdown && (
                <div
                    className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm"
                    onClick={() => setShowDropdown(false)}
                />
            )}

            {/* Sticky Search Bar Container - Higher Z than backdrop */}
            <div
                className={`fixed top-4 left-1/2 -translate-x-1/2 z-[1001] ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
                    }`}
            >
                <div className="relative">
                    {/* Search Input */}
                    <div className="relative">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onFocus={() => results.length > 0 && setShowDropdown(true)}
                            placeholder={isSeriesMode ? "Search series..." : "Search movies..."}
                            className={`w-[300px] md:w-[400px] px-4 py-2.5 pl-10 rounded-full bg-[rgba(11,15,20,0.95)] border border-white/20 text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 ${inputFocusClass} shadow-[0_10px_40px_rgba(0,0,0,0.5)]`}
                        />
                        <svg
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        {isSearching && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <div className={`w-4 h-4 border-2 ${spinnerClass} border-t-transparent rounded-full animate-spin`}></div>
                            </div>
                        )}
                    </div>

                    {/* Dropdown Results */}
                    <MemoizedResultsDropdown
                        show={showDropdown && results.length > 0}
                        results={results}
                        isSeriesMode={isSeriesMode}
                        onResultClick={handleResultClick}
                    />
                </div>
            </div>
        </>
    );
}

const MemoizedResultsDropdown = memo(function ResultsDropdown({ show, results, isSeriesMode, onResultClick }) {
    if (!show) return null;

    return (
        <div
            className="absolute top-full left-0 right-0 mt-2 bg-[rgba(11,15,20,0.98)] backdrop-blur-xl border border-white/20 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden max-h-[60vh] overflow-y-auto"
            onMouseDown={(e) => e.preventDefault()}
        >
            {results.map((item, idx) => (
                <button
                    key={item._id || item.tmdbId || item.id || idx}
                    onClick={() => onResultClick(item)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-white/10 transition-colors text-left"
                >
                    <div className="w-10 h-14 shrink-0 rounded-lg overflow-hidden bg-white/5">
                        {item.poster ? (
                            <img src={item.poster} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/30 text-xs">N/A</div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm truncate">{item.title || item.name}</p>
                        <p className="text-xs text-white/50">{item.year}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${item.source === 'catalogue'
                        ? 'bg-green-500/20 text-green-400'
                        : isSeriesMode
                            ? 'bg-orange-500/20 text-orange-400'
                            : 'bg-purple-500/20 text-purple-400'
                        }`}>
                        {item.source === 'catalogue' ? 'Download' : 'Stream'}
                    </span>
                </button>
            ))}
        </div>
    );
});
