'use client';

import { useRef } from 'react';
import Link from 'next/link';
import OptimizedPoster from './OptimizedPoster';
import AddToListButton from './AddToListButton';

export default function GenreRow({ title, movies, genreId, viewAllUrl }) {
    const scrollContainerRef = useRef(null);

    // Determine the link target
    const linkTarget = viewAllUrl || `/?genre=${encodeURIComponent(genreId)}`;

    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            const { current } = scrollContainerRef;
            const scrollAmount = direction === 'left' ? -current.offsetWidth : current.offsetWidth;
            current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    if (!movies || movies.length === 0) return null;

    return (
        <section className="mb-12 relative group/section">
            <div className="flex items-center justify-between px-1 mb-4">
                <h2 className="text-2xl font-bold text-[var(--fg)] flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-[var(--accent)] rounded-full inline-block"></span>
                    {title}
                </h2>
                <Link
                    href={linkTarget}
                    className="text-sm font-bold text-[var(--accent)] hover:text-white transition-colors bg-[var(--accent)]/10 px-4 py-2 rounded-full border border-[var(--accent)]/20 hover:bg-[var(--accent)]"
                >
                    View All
                </Link>
            </div>

            <div className="relative group">
                {/* Scroll Buttons */}
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-[var(--accent)] text-white p-3 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all -translate-x-1/2 shadow-xl border border-white/10 hidden md:block"
                    aria-label="Scroll left"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>

                <button
                    onClick={() => scroll('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-[var(--accent)] text-white p-3 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all translate-x-1/2 shadow-xl border border-white/10 hidden md:block"
                    aria-label="Scroll right"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>

                {/* Horizontal Scroll Container */}
                <div
                    ref={scrollContainerRef}
                    className="flex gap-4 overflow-x-auto pb-6 pt-2 px-1 snap-x scrollbar-hide -mx-2 px-2 mask-linear-fade"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {movies.map((movie) => (
                        <div
                            key={movie._id}
                            className="flex-none w-[160px] sm:w-[180px] md:w-[200px] snap-start group/card relative"
                        >
                            <Link href={`/movie/${movie.__id || movie._id}`} className="block relative aspect-[2/3] rounded-xl overflow-hidden shadow-lg border border-[var(--border)] group-hover/card:border-[var(--accent)] transition-all group-hover/card:scale-105 duration-300 bg-[var(--card-bg)]">
                                <OptimizedPoster
                                    src={movie.poster}
                                    title={movie.title}
                                    year={movie.year}
                                    width={200}
                                    height={300}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-end p-3">
                                    <span className="text-white font-bold text-sm line-clamp-2">{movie.title}</span>
                                </div>

                                {/* Quick Add Button */}
                                <div className="absolute top-2 right-2 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                    <AddToListButton movieId={movie._id || movie.__id} movieTitle={movie.title} variant="icon" />
                                </div>
                            </Link>
                            <div className="mt-2 px-1">
                                <Link href={`/movie/${movie.__id || movie._id}`} className="block">
                                    <h3 className="font-bold text-[var(--fg)] text-sm truncate hover:text-[var(--accent)] transition-colors">{movie.title}</h3>
                                </Link>
                                <p className="text-xs text-[var(--muted)]">{movie.year || '—'}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
