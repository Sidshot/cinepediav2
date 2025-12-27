'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function SeriesSearch({ initialQuery = '' }) {
    const router = useRouter();
    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    // Debounced search
    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            setShowDropdown(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&mode=series`);
                const data = await res.json();
                setResults(data.series || []);
                setShowDropdown(true);
            } catch (e) {
                console.error('Series search error:', e);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    // Handle result click
    const handleResultClick = useCallback((series) => {
        setShowDropdown(false);
        router.push(`/series/${series.tmdbId}`);
    }, [router]);

    const hasResults = results.length > 0;

    return (
        <div className="relative w-full max-w-2xl mx-auto px-4 mb-8">
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => hasResults && setShowDropdown(true)}
                    placeholder="Search TV series..."
                    className="w-full px-5 py-3.5 pl-12 rounded-2xl bg-[#0a0a0a]/80 border border-orange-600/30 text-[var(--fg)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent"
                />
                <svg
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {isLoading && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <div className="w-5 h-5 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
            </div>

            {/* Dropdown Results */}
            {showDropdown && hasResults && (
                <div
                    className="absolute top-full left-4 right-4 mt-2 bg-[#1a1a1f] border-2 border-orange-600/30 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden z-50 max-h-[70vh] overflow-y-auto"
                    onMouseDown={(e) => e.preventDefault()}
                >
                    <div className="px-4 py-2 bg-orange-600/10 text-orange-400 text-xs font-bold uppercase tracking-wider">
                        TV Series
                    </div>
                    {results.map((series) => (
                        <button
                            key={series.tmdbId}
                            onClick={() => handleResultClick(series)}
                            className="w-full flex items-center gap-4 p-3 hover:bg-white/5 transition-colors text-left"
                        >
                            <div className="w-12 h-16 shrink-0 rounded-lg overflow-hidden bg-white/5">
                                {series.poster ? (
                                    <img
                                        src={series.poster}
                                        alt={series.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[var(--muted)] text-xs">
                                        N/A
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-[var(--fg)] truncate">{series.title}</p>
                                <p className="text-sm text-[var(--muted)]">{series.year} • ★ {series.tmdbRating?.toFixed(1) || 'N/A'}</p>
                            </div>
                            <span className="shrink-0 text-xs bg-orange-600/20 text-orange-400 px-2 py-1 rounded-full">
                                Stream
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {/* Click outside to close */}
            {showDropdown && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowDropdown(false)}
                />
            )}
        </div>
    );
}
