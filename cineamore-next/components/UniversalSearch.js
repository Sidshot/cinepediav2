'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import OptimizedPoster from './OptimizedPoster';

export default function UniversalSearch({ initialQuery = '', onSearch }) {
    const router = useRouter();
    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState({ catalogue: [], tmdb: [] });
    const [isLoading, setIsLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    // Debounced search
    useEffect(() => {
        if (query.length < 2) {
            setResults({ catalogue: [], tmdb: [] });
            setShowDropdown(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                setResults(data);
                setShowDropdown(true);
            } catch (e) {
                console.error('Search error:', e);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    // Handle search submit
    const handleSubmit = (e) => {
        e.preventDefault();
        setShowDropdown(false);
        if (onSearch) {
            onSearch(query);
        } else {
            router.push(`/?q=${encodeURIComponent(query)}`);
        }
    };

    // Handle result click
    const handleResultClick = useCallback((result) => {
        setShowDropdown(false);
        if (result.source === 'catalogue') {
            router.push(`/movie/${result.__id || result._id}`);
        } else {
            router.push(`/tmdb/${result.tmdbId}`);
        }
    }, [router]);

    const hasResults = results.catalogue.length > 0 || results.tmdb.length > 0;

    return (
        <div className="relative w-full max-w-2xl">
            <form onSubmit={handleSubmit}>
                <div className="relative">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => hasResults && setShowDropdown(true)}
                        placeholder="Search any movie..."
                        className="w-full px-5 py-3.5 pl-12 rounded-2xl bg-white/5 border border-white/10 text-[var(--fg)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all backdrop-blur-md"
                    />
                    <svg
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {isLoading && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                </div>
            </form>

            {/* Dropdown Results */}
            {showDropdown && hasResults && (
                <div
                    className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1f] border-2 border-[var(--accent)]/30 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden z-50 max-h-[70vh] overflow-y-auto"
                    onMouseDown={(e) => e.preventDefault()} // Prevent blur on click
                >
                    {/* Catalogue Results */}
                    {results.catalogue.length > 0 && (
                        <div>
                            <div className="px-4 py-2 bg-[var(--accent)]/10 text-[var(--accent)] text-xs font-bold uppercase tracking-wider">
                                In Our Catalogue
                            </div>
                            {results.catalogue.map((movie) => (
                                <button
                                    key={movie._id}
                                    onClick={() => handleResultClick(movie)}
                                    className="w-full flex items-center gap-4 p-3 hover:bg-white/5 transition-colors text-left"
                                >
                                    <div className="w-12 h-16 shrink-0 rounded-lg overflow-hidden bg-white/5">
                                        <OptimizedPoster
                                            src={movie.poster}
                                            title={movie.title}
                                            year={movie.year}
                                            width={48}
                                            height={72}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-[var(--fg)] truncate">{movie.title}</p>
                                        <p className="text-sm text-[var(--muted)]">{movie.year} • {movie.director || 'Unknown'}</p>
                                    </div>
                                    <span className="shrink-0 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                                        Download
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* TMDB Results */}
                    {results.tmdb.length > 0 && (
                        <div>
                            <div className="px-4 py-2 bg-purple-500/10 text-purple-400 text-xs font-bold uppercase tracking-wider">
                                Stream Only (Not in Catalogue)
                            </div>
                            {results.tmdb.map((movie) => (
                                <button
                                    key={movie.tmdbId}
                                    onClick={() => handleResultClick(movie)}
                                    className="w-full flex items-center gap-4 p-3 hover:bg-white/5 transition-colors text-left"
                                >
                                    <div className="w-12 h-16 shrink-0 rounded-lg overflow-hidden bg-white/5">
                                        {movie.poster ? (
                                            <img
                                                src={movie.poster}
                                                alt={movie.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[var(--muted)] text-xs">
                                                N/A
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-[var(--fg)] truncate">{movie.title}</p>
                                        <p className="text-sm text-[var(--muted)]">{movie.year} • ★ {movie.tmdbRating?.toFixed(1) || 'N/A'}</p>
                                    </div>
                                    <span className="shrink-0 text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full">
                                        Stream
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
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
