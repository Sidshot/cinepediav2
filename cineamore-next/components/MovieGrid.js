'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import SearchBar from './SearchBar';

export default function MovieGrid({ initialMovies }) {
    const [query, setQuery] = useState('');
    const [filterYear, setFilterYear] = useState('all');
    const [filterDirector, setFilterDirector] = useState('all');

    // Extract unique years and directors for options
    const years = useMemo(() => {
        const y = initialMovies
            .map(m => parseInt(m.year))
            .filter(num => !isNaN(num)); // Valid numbers only
        return [...new Set(y)].sort((a, b) => b - a);
    }, [initialMovies]);

    const directors = useMemo(() => {
        const d = initialMovies
            .map(m => m.director)
            .filter(Boolean)
            .map(s => String(s).trim()) // Ensure string
            .filter(s => s.length > 0);
        return [...new Set(d)].sort();
    }, [initialMovies]);

    // Filtering Logic
    const filteredMovies = useMemo(() => {
        let result = initialMovies;

        // Text Search (Title, Director, Year)
        if (query) {
            const lowQuery = query.toLowerCase();
            result = result.filter(m =>
                (m.title && m.title.toLowerCase().includes(lowQuery)) ||
                (m.director && m.director.toLowerCase().includes(lowQuery)) ||
                (m.year && m.year.toString().includes(lowQuery))
            );
        }

        // Year Filter
        if (filterYear !== 'all') {
            result = result.filter(m => m.year === parseInt(filterYear));
        }

        // Director Filter
        if (filterDirector !== 'all') {
            result = result.filter(m => m.director === filterDirector);
        }

        return result;
    }, [initialMovies, query, filterYear, filterDirector]);

    return (
        <div className="w-full">
            {/* Controls Bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between items-center bg-[rgba(255,255,255,0.02)] p-4 rounded-2xl border border-[var(--border)] backdrop-blur-sm">
                <SearchBar onSearch={setQuery} />

                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <select
                        value={filterYear}
                        onChange={(e) => setFilterYear(e.target.value)}
                        className="h-[42px] px-4 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[var(--border)] text-sm focus:border-[var(--accent)] outline-none"
                    >
                        <option value="all">All Years</option>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>

                    <select
                        value={filterDirector}
                        onChange={(e) => setFilterDirector(e.target.value)}
                        className="h-[42px] px-4 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[var(--border)] text-sm focus:border-[var(--accent)] outline-none max-w-[200px]"
                    >
                        <option value="all">All Directors</option>
                        {directors.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
            </div>

            {/* Stats */}
            <div className="mb-4 text-[var(--muted)] text-sm px-2">
                Showing {filteredMovies.length} results
            </div>

            {/* Grid */}
            <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-6">
                {filteredMovies.map((movie) => {
                    const lbLink = movie.letterboxd || movie.lb; // Support both keys
                    return (
                        <div key={movie._id || movie.__id} className="group relative flex flex-col h-full p-4 rounded-[var(--radius)] card-gloss transition-all hover:-translate-y-2 hover:shadow-2xl hover:border-white/20">
                            {/* Poster Link */}
                            <Link href={`/movie/${movie._id || movie.__id}`} className="block aspect-[2/3] w-full rounded-xl bg-black/40 mb-4 shadow-lg overflow-hidden relative">
                                <img
                                    src={`https://tse2.mm.bing.net/th?q=${encodeURIComponent(`"${movie.title}" (${movie.year}) film poster`)}&w=300&h=450&c=7&rs=1&p=0`}
                                    alt={movie.title}
                                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                            </Link>

                            {/* Title Link */}
                            <Link href={`/movie/${movie._id || movie.__id}`} className="block">
                                <h3 className="text-lg font-extrabold text-[var(--fg)] tracking-tight leading-snug mb-1 group-hover:text-[var(--accent)] transition-colors">{movie.title}</h3>
                            </Link>

                            <div className="text-xs text-[var(--muted)] mb-3">
                                <span className="bg-[var(--accent)]/10 text-[var(--accent)] px-2 py-0.5 rounded mr-2 font-bold">{movie.year || 'N/A'}</span>
                                {movie.original && <div className="mt-1 opacity-70 truncate">Original: {movie.original}</div>}
                                {movie.director && <div className="opacity-70 truncate">Director: {movie.director}</div>}
                            </div>

                            {/* Rating */}
                            <div className="mt-auto mb-4 flex items-center gap-1 opacity-80">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <svg key={i} className={`w-4 h-4 ${i <= Math.round((movie.ratingSum / movie.ratingCount) || 0) ? 'fill-[var(--muted)]' : 'fill-[#333]'}`} viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                                ))}
                                <span className="text-xs ml-1 font-mono">{parseFloat((movie.ratingSum / movie.ratingCount) || 0).toFixed(1)}</span>
                            </div>

                            {/* Actions Row */}
                            <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-white/5">
                                {/* Download Button */}
                                <a
                                    href={movie.download || movie.drive || '#'}
                                    target="_blank"
                                    className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${movie.download || movie.drive ? 'bg-[#3dffb8]/10 text-[#3dffb8] border border-[#3dffb8]/20 hover:bg-[#3dffb8]/20' : 'opacity-30 cursor-not-allowed bg-white/5'}`}
                                    onClick={(e) => { e.stopPropagation(); }}
                                >
                                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" /></svg>
                                    Download
                                </a>

                                {/* Letterboxd / Info Button */}
                                {lbLink ? (
                                    <a
                                        href={lbLink}
                                        target="_blank"
                                        className="flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold bg-[#ffc043]/10 text-[#ffc043] border border-[#ffc043]/20 hover:bg-[#ffc043]/20 transition-all"
                                        onClick={(e) => { e.stopPropagation(); }}
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

            {filteredMovies.length === 0 && (
                <div className="py-20 text-center border border-dashed border-[var(--border)] rounded-3xl text-[var(--muted)]">
                    No movies found matching your criteria.
                </div>
            )}
        </div>
    );
}
