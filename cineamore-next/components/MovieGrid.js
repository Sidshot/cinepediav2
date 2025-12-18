'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SearchBar from './SearchBar';
import OptimizedPoster from './OptimizedPoster';
import AddToListButton from './AddToListButton';

// Priority order for genre display
const PRIORITY_GENRES = ['Mystery', 'Horror', 'Drama', 'Thriller', 'Action', 'Sci-Fi', 'Comedy', 'Romance'];
const DEFAULT_VISIBLE_COUNT = 8;

export default function MovieGrid({
    initialMovies,
    allGenres = [],
    currentPage = 1,
    totalPages = 1,
    totalCount = 0,
    currentGenre = null,
    currentSearch = '',
    currentSort = 'newest'
}) {
    const router = useRouter();
    const [showAllGenres, setShowAllGenres] = useState(false);

    // Sort genres: priority first, then alphabetical
    const sortedGenres = useMemo(() => {
        const sorted = [...allGenres].sort((a, b) => {
            const aIndex = PRIORITY_GENRES.findIndex(p => p.toLowerCase() === a.toLowerCase());
            const bIndex = PRIORITY_GENRES.findIndex(p => p.toLowerCase() === b.toLowerCase());

            if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
            if (aIndex !== -1) return -1;
            if (bIndex !== -1) return 1;
            return a.localeCompare(b);
        });
        return sorted;
    }, [allGenres]);

    const visibleGenres = showAllGenres ? sortedGenres : sortedGenres.slice(0, DEFAULT_VISIBLE_COUNT);
    const hasMoreGenres = sortedGenres.length > DEFAULT_VISIBLE_COUNT;

    // Build URL with current filters
    const buildUrl = useCallback((overrides = {}) => {
        const params = new URLSearchParams();

        const genre = overrides.genre !== undefined ? overrides.genre : currentGenre;
        const search = overrides.search !== undefined ? overrides.search : currentSearch;
        const sort = overrides.sort !== undefined ? overrides.sort : currentSort;
        const page = overrides.page !== undefined ? overrides.page : 1; // Reset to page 1 on filter change

        if (genre && genre !== 'all') params.set('genre', genre);
        if (search && search.trim()) params.set('q', search.trim());
        if (sort && sort !== 'newest') params.set('sort', sort);
        if (page > 1) params.set('page', page.toString());

        const queryString = params.toString();
        return queryString ? `/?${queryString}` : '/';
    }, [currentGenre, currentSearch, currentSort]);

    // Handle search submit (on Enter or explicit submit)
    const handleSearch = useCallback((query) => {
        router.push(buildUrl({ search: query, page: 1 }));
    }, [router, buildUrl]);

    // Handle sort change
    const handleSortChange = useCallback((e) => {
        router.push(buildUrl({ sort: e.target.value, page: 1 }));
    }, [router, buildUrl]);

    // Handle Genre Click -> Navigation
    const handleGenreClick = useCallback((genre) => {
        router.push(buildUrl({ genre: genre === 'all' ? null : genre, page: 1 }));
    }, [router, buildUrl]);

    // Reusable Pagination Component
    const PaginationControls = () => {
        if (totalPages <= 1) return null;

        // Use buildUrl to preserve all current filters
        const getPageUrl = (page) => buildUrl({ page });

        return (
            <div className="flex justify-center items-center gap-4 py-6 border-t border-[var(--border)] mt-4">
                <button
                    onClick={() => router.push(getPageUrl(currentPage - 1))}
                    disabled={currentPage <= 1}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${currentPage <= 1
                        ? 'opacity-30 cursor-not-allowed bg-white/5'
                        : 'bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 hover:bg-[var(--accent)]/20 hover:-translate-y-1'
                        }`}
                >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg>
                    Previous
                </button>

                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[var(--border)]">
                    <span className="text-[var(--fg)] font-bold">{currentPage}</span>
                    <span className="text-[var(--muted)]">of</span>
                    <span className="text-[var(--fg)] font-bold">{totalPages}</span>
                </div>

                <button
                    onClick={() => router.push(getPageUrl(currentPage + 1))}
                    disabled={currentPage >= totalPages}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${currentPage >= totalPages
                        ? 'opacity-30 cursor-not-allowed bg-white/5'
                        : 'bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 hover:bg-[var(--accent)]/20 hover:-translate-y-1'
                        }`}
                >
                    Next
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg>
                </button>
            </div>
        );
    };

    return (
        <div className="w-full">
            {/* Controls Bar - Unified Layout */}
            <div className="flex flex-col xl:flex-row gap-4 mb-8 items-center justify-between bg-[rgba(255,255,255,0.02)] p-2 rounded-3xl border border-[var(--border)] backdrop-blur-xl shadow-lg">

                {/* Search Bar */}
                <div className="w-full xl:w-auto xl:min-w-[300px]">
                    <SearchBar onSearch={handleSearch} defaultValue={currentSearch} />
                </div>

                {/* Genre Filter Tiles - Centered & Flexible */}
                {sortedGenres.length > 0 && (
                    <div className="flex-1 flex flex-wrap justify-center gap-2 px-4 overflow-hidden">
                        <button
                            onClick={() => handleGenreClick('all')}
                            className={`genre-tile ${!currentGenre ? 'active' : ''}`}
                        >
                            All
                        </button>
                        {visibleGenres.map(genre => (
                            <button
                                key={genre}
                                onClick={() => handleGenreClick(genre)}
                                className={`genre-tile ${currentGenre === genre ? 'active' : ''}`}
                            >
                                {genre}
                            </button>
                        ))}
                        {hasMoreGenres && (
                            <button
                                onClick={() => setShowAllGenres(!showAllGenres)}
                                className="genre-tile more-btn"
                            >
                                {showAllGenres ? '−' : `+`}
                            </button>
                        )}
                    </div>
                )}

                {/* Sort Dropdown */}
                <div className="flex gap-2 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 justify-end">
                    <select
                        value={currentSort}
                        onChange={handleSortChange}
                        className="h-[42px] px-4 rounded-full bg-[var(--card-bg)] border border-[var(--border)] text-sm font-semibold text-[var(--fg)] focus:border-[var(--accent)] outline-none cursor-pointer hover:brightness-110 transition-all"
                    >
                        <option value="newest">Recently Added</option>
                        <option value="oldest">Oldest Added</option>
                        <option value="year-desc">Year: New → Old</option>
                        <option value="year-asc">Year: Old → New</option>
                    </select>
                </div>
            </div>

            {/* Search Results Info */}
            {currentSearch && (
                <div className="mb-4 px-4 py-2 bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-xl text-sm">
                    <span className="text-[var(--muted)]">Search results for </span>
                    <span className="font-bold text-[var(--accent)]">"{currentSearch}"</span>
                    <span className="text-[var(--muted)]"> — {totalCount} films found</span>
                    <button
                        onClick={() => router.push('/')}
                        className="ml-4 text-red-400 hover:text-red-300 font-semibold"
                    >
                        ✕ Clear
                    </button>
                </div>
            )}

            {/* Top Pagination */}
            <PaginationControls />

            {/* Grid */}
            <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-6">
                {initialMovies.map((movie) => {
                    const lbLink = movie.letterboxd || movie.lb; // Support both keys
                    return (
                        <div key={movie._id || movie.__id} className="group relative flex flex-col h-full p-4 rounded-[var(--radius)] card-gloss transition-all hover:-translate-y-2 hover:shadow-2xl hover:border-white/20">
                            {/* Poster Container */}
                            <div className="relative aspect-[2/3] w-full rounded-xl mb-4 shadow-lg overflow-hidden">
                                {/* Poster Link */}
                                <Link href={`/movie/${movie._id || movie.__id}`} className="block w-full h-full">
                                    <OptimizedPoster
                                        src={movie.poster}
                                        title={movie.title}
                                        year={movie.year}
                                        width={250}
                                        height={375}
                                        className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                                </Link>

                                {/* Save Button - Top Right - Always Visible */}
                                <div className="absolute top-3 right-3 z-10">
                                    <AddToListButton movieId={movie._id || movie.__id} movieTitle={movie.title} variant="prominent" />
                                </div>
                            </div>

                            {/* Title Link */}
                            <Link href={`/movie/${movie._id || movie.__id}`} className="block">
                                <h3 className="text-lg font-extrabold text-[var(--fg)] tracking-tight leading-snug mb-1 group-hover:text-[var(--accent)] transition-colors">{movie.title}</h3>
                            </Link>

                            <div className="text-xs text-[var(--muted)] mb-3">
                                <span className="bg-[var(--accent)]/10 text-[var(--accent)] px-2 py-0.5 rounded mr-2 font-bold">{movie.year || 'N/A'}</span>
                                {movie.original && <div className="mt-1 opacity-70 truncate">Original: {movie.original}</div>}
                                {movie.director && <div className="opacity-70 truncate">Director: {movie.director}</div>}
                            </div>

                            {/* Genres */}
                            {movie.genre && movie.genre.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-3">
                                    {movie.genre.slice(0, 3).map((g, i) => (
                                        <span key={i} className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-white/10 rounded-md text-[var(--muted)] border border-white/5">
                                            {g}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Rating */}
                            {(() => {
                                // Safe rating calculation to prevent hydration mismatches
                                const sum = Number(movie.ratingSum) || 0;
                                const count = Number(movie.ratingCount) || 0;
                                const avgRating = count > 0 ? sum / count : 0;
                                const roundedRating = Math.round(avgRating);
                                const displayRating = avgRating.toFixed(1);

                                return (
                                    <div className="mt-auto mb-4 flex items-center gap-1 opacity-80">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <svg key={i} className={`w-4 h-4 ${i <= roundedRating ? 'fill-[var(--muted)]' : 'fill-[#333]'}`} viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                                        ))}
                                        <span className="text-xs ml-1 font-mono">{displayRating}</span>
                                    </div>
                                );
                            })()}

                            {/* Actions Row - z-10 ensures it's above card-gloss ::after */}
                            <div className="relative z-10 grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-white/5">
                                {/* Download Button - supports downloadLinks array OR legacy dl/drive fields */}
                                {(() => {
                                    // Get download URL from various sources
                                    const getDownloadUrl = () => {
                                        if (movie.downloadLinks?.length > 0) return movie.downloadLinks[0].url;
                                        if (movie.dl) return movie.dl;
                                        if (movie.drive) return movie.drive;
                                        return null;
                                    };
                                    const downloadUrl = getDownloadUrl();

                                    return (
                                        <a
                                            href={downloadUrl || '#'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${downloadUrl
                                                ? 'bg-[#3dffb8]/10 text-[#3dffb8] border border-[#3dffb8]/20 hover:bg-[#3dffb8]/20'
                                                : 'opacity-30 cursor-not-allowed bg-white/5'
                                                }`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (!downloadUrl) {
                                                    e.preventDefault();
                                                }
                                            }}
                                        >
                                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" /></svg>
                                            Download
                                        </a>
                                    );
                                })()}

                                {/* Letterboxd / Info Button */}
                                {lbLink ? (
                                    <a
                                        href={lbLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold bg-[#ffc043]/10 text-[#ffc043] border border-[#ffc043]/20 hover:bg-[#ffc043]/20 transition-all"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z" /></svg>
                                        Letterboxd
                                    </a>
                                ) : (
                                    <Link
                                        href={`/movie/${movie._id || movie.__id}`}
                                        className="flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold bg-white/5 text-[var(--muted)] border border-white/10 hover:bg-white/10"
                                    >
                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
                                        Info
                                    </Link>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {initialMovies.length === 0 && (
                <div className="py-20 text-center border border-dashed border-[var(--border)] rounded-3xl text-[var(--muted)]">
                    {currentSearch
                        ? `No movies found matching "${currentSearch}"`
                        : 'No movies found matching your criteria.'
                    }
                </div>
            )}

            {/* Pagination Controls */}
            <PaginationControls />
        </div>
    );
}
