import { searchSeries } from '@/lib/tmdb';
import Link from 'next/link';

export const dynamic = 'force-dynamic'; // No caching for search

export default async function SeriesSearchPage({ searchParams }) {
    const query = searchParams?.q || '';
    let results = [];

    if (query.trim().length >= 2) {
        try {
            const seriesResults = await searchSeries(query);
            results = Array.isArray(seriesResults) ? seriesResults : [];
        } catch (e) {
            console.error('Series search error:', e);
        }
    }

    return (
        <main className="min-h-screen bg-[var(--bg)] text-[var(--fg)] px-4 py-8">
            {/* Back button and search info */}
            <div className="max-w-7xl mx-auto mb-8">
                <Link
                    href="/series"
                    className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 mb-4"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Series
                </Link>

                <h1 className="text-3xl font-bold mb-2">
                    Search Results for "<span className="text-orange-400">{query}</span>"
                </h1>
                <p className="text-[var(--muted)]">
                    {results.length} series found
                </p>
            </div>

            {/* Results Grid */}
            <div className="max-w-7xl mx-auto">
                {results.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {results.map(series => (
                            <Link
                                key={series.id}
                                href={`/series/${series.id}`}
                                className="group relative flex flex-col rounded-xl overflow-hidden bg-[var(--card-bg)] border border-white/5 hover:border-orange-500/30 transition-all hover:-translate-y-1"
                            >
                                {/* Poster */}
                                <div className="aspect-[2/3] relative overflow-hidden bg-white/5">
                                    {series.poster_path ? (
                                        <img
                                            src={`https://image.tmdb.org/t/p/w342${series.poster_path}`}
                                            alt={series.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white/30 text-sm">
                                            No Poster
                                        </div>
                                    )}

                                    {/* Rating Badge */}
                                    {series.vote_average > 0 && (
                                        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                                            <span className="text-yellow-400">★</span>
                                            <span>{series.vote_average.toFixed(1)}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="p-3">
                                    <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-orange-400 transition-colors">
                                        {series.name}
                                    </h3>
                                    {series.first_air_date && (
                                        <p className="text-xs text-[var(--muted)] mt-1">
                                            {series.first_air_date.split('-')[0]}
                                        </p>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : query.trim().length >= 2 ? (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">📺</div>
                        <h2 className="text-xl font-bold text-[var(--muted)] mb-2">No series found</h2>
                        <p className="text-[var(--muted)]">Try a different search term</p>
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">🔍</div>
                        <h2 className="text-xl font-bold text-[var(--muted)] mb-2">Enter a search term</h2>
                        <p className="text-[var(--muted)]">Type at least 2 characters to search</p>
                    </div>
                )}
            </div>
        </main>
    );
}
