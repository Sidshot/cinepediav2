'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TV_GENRES } from '@/lib/tv-genres';

// Genre pills for TV series (using TMDB TV genre IDs)
const GENRE_PILLS = TV_GENRES;

/**
 * SeriesHero - Shows the hero section with "A Series For You",
 * search bar, and genre filters. Does NOT show a grid - that's handled
 * by SeriesGenreRow components below.
 */
export default function SeriesHero({ heroSeries = null }) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showAllGenres, setShowAllGenres] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    // Handle Enter key to navigate to search results page
    const handleSearchSubmit = (e) => {
        if (e.key === 'Enter' && searchQuery.trim().length >= 2) {
            router.push(`/series/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setShowDropdown(false);
        }
    };

    // Debounced search
    useEffect(() => {
        if (searchQuery.length < 2) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&mode=series`);
                const data = await res.json();
                setSearchResults(data.series || []);
                setShowDropdown(true);
            } catch (e) {
                console.error('Search error:', e);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const visibleGenres = showAllGenres ? GENRE_PILLS : GENRE_PILLS.slice(0, 8);

    return (
        <div className="relative">
            {/* Hero Section - "A Series For You" */}
            {heroSeries && (
                <div className="relative w-full h-[55vh] overflow-hidden mb-8">
                    {heroSeries.backdrop_path && (
                        <img
                            src={`https://image.tmdb.org/t/p/w1280${heroSeries.backdrop_path}`}
                            alt={heroSeries.name}
                            className="absolute inset-0 w-full h-full object-cover opacity-50"
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/60 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg)] via-transparent to-transparent" />

                    <div className="absolute bottom-0 left-0 right-0 p-8 max-w-4xl">
                        <span className="text-orange-400 text-sm font-bold tracking-wider mb-2 block">
                            ✦ A SERIES FOR YOU
                        </span>
                        <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-2 drop-shadow-2xl">
                            {heroSeries.name}
                        </h1>
                        <div className="flex gap-3 mb-4">
                            {heroSeries.first_air_date && (
                                <span className="bg-orange-600 text-white px-3 py-1 rounded-md text-sm font-bold">
                                    {heroSeries.first_air_date.split('-')[0]}
                                </span>
                            )}
                            {heroSeries.vote_average > 0 && (
                                <span className="bg-white/10 backdrop-blur-md text-white px-3 py-1 rounded-md text-sm border border-white/20">
                                    ★ {heroSeries.vote_average.toFixed(1)}
                                </span>
                            )}
                        </div>
                        <p className="text-lg text-white/80 line-clamp-2 max-w-2xl mb-6">
                            {heroSeries.overview}
                        </p>
                        <div className="flex gap-4">
                            <Link
                                href={`/series/${heroSeries.id}`}
                                className="inline-flex items-center gap-2 bg-white text-black font-bold px-6 py-3 rounded-xl hover:bg-white/90 transition-colors"
                            >
                                <span>▶</span> Play Now
                            </Link>
                            <Link
                                href={`/series/${heroSeries.id}`}
                                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold px-6 py-3 rounded-xl hover:bg-white/20 transition-colors"
                            >
                                <span>ⓘ</span> More Info
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto px-4 mb-6 relative z-20">
                <div className="relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearchSubmit}
                        onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                        placeholder="Search any series... (Press Enter)"
                        className="w-full px-5 py-3.5 pl-12 rounded-2xl bg-[#0a0a0a]/80 border border-white/10 text-[var(--fg)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                    <svg
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {isSearching && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}

                    {/* Search Dropdown */}
                    {showDropdown && searchResults.length > 0 && (
                        <div
                            className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1f] border-2 border-orange-500/30 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden max-h-[60vh] overflow-y-auto z-30"
                            onMouseDown={(e) => e.preventDefault()}
                        >
                            <div className="px-4 py-2 bg-orange-500/10 text-orange-400 text-xs font-bold uppercase tracking-wider">
                                TV Series
                            </div>
                            {searchResults.slice(0, 8).map(series => (
                                <Link
                                    key={series.tmdbId || series.id}
                                    href={`/series/${series.tmdbId || series.id}`}
                                    onClick={() => {
                                        setShowDropdown(false);
                                        setSearchQuery('');
                                    }}
                                    className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors"
                                >
                                    <div className="w-10 h-14 shrink-0 rounded-lg overflow-hidden bg-white/5">
                                        {series.poster ? (
                                            <img src={series.poster} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-white/30 text-xs">N/A</div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-white text-sm truncate">{series.title || series.name}</p>
                                        <p className="text-xs text-white/50">{series.year}</p>
                                    </div>
                                    <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full">
                                        Stream
                                    </span>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Click outside to close */}
                {showDropdown && (
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowDropdown(false)}
                    />
                )}
            </div>

            {/* Genre Pills */}
            <div className="px-4 mb-8">
                <div className="flex flex-wrap items-center gap-2 justify-center">
                    {/* All Button */}
                    <button
                        className="px-4 py-2 rounded-full text-sm font-medium transition-all bg-orange-600 text-white"
                    >
                        ALL
                    </button>

                    {/* Genre Pills */}
                    {visibleGenres.map(genre => (
                        <Link
                            key={genre.id}
                            href={`/series/genre/${genre.id}`}
                            className="px-4 py-2 rounded-full text-sm font-medium transition-all bg-white/5 text-[var(--muted)] hover:bg-white/10 border border-white/10"
                        >
                            {genre.name}
                        </Link>
                    ))}

                    {/* Show More */}
                    {!showAllGenres && GENRE_PILLS.length > 8 && (
                        <button
                            onClick={() => setShowAllGenres(true)}
                            className="px-4 py-2 rounded-full text-sm font-medium bg-white/5 text-orange-400 hover:bg-white/10 border border-white/10"
                        >
                            +
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
