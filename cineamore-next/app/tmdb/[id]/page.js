import { getMovieDetails } from '@/lib/tmdb';
import StreamingPlayer from '@/components/StreamingPlayer';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function TMDBMoviePage({ params }) {
    const { id } = await params;
    const tmdbId = parseInt(id, 10);

    if (isNaN(tmdbId)) {
        notFound();
    }

    // Fetch full details from TMDB
    const movie = await getMovieDetails(tmdbId);

    if (movie.error) {
        notFound();
    }

    return (
        <main className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
            {/* Hero Section with Backdrop */}
            <div className="relative w-full h-[50vh] overflow-hidden">
                {movie.backdropUrl && (
                    <img
                        src={movie.backdropUrl}
                        alt={movie.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-40"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/60 to-transparent" />

                {/* Back Button */}
                <Link
                    href="/"
                    className="absolute top-6 left-6 z-20 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full text-white hover:bg-white/20 transition-colors"
                >
                    ← Back
                </Link>
            </div>

            {/* Content */}
            <div className="relative -mt-48 z-10 px-4 md:px-8 max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Poster */}
                    <div className="shrink-0 w-[200px] md:w-[280px]">
                        {movie.posterUrl ? (
                            <img
                                src={movie.posterUrl}
                                alt={movie.title}
                                className="w-full rounded-2xl shadow-2xl border border-white/10"
                            />
                        ) : (
                            <div className="w-full aspect-[2/3] rounded-2xl bg-[var(--card-bg)] flex items-center justify-center border border-white/10">
                                <span className="text-[var(--muted)]">No Poster</span>
                            </div>
                        )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 space-y-4">
                        {/* Stream Only Badge */}
                        <div className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                            STREAM ONLY
                        </div>

                        <h1 className="text-3xl md:text-5xl font-extrabold text-white">
                            {movie.title}
                        </h1>

                        {movie.original && movie.original !== movie.title && (
                            <p className="text-lg text-[var(--muted)] italic">{movie.original}</p>
                        )}

                        <div className="flex flex-wrap gap-3 items-center">
                            {movie.year && (
                                <span className="bg-[var(--accent)] text-black px-3 py-1 rounded-md font-bold text-sm">
                                    {movie.year}
                                </span>
                            )}
                            {movie.director && (
                                <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-md text-sm border border-white/20">
                                    {movie.director}
                                </span>
                            )}
                        </div>

                        {/* Genres */}
                        {movie.genre && movie.genre.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {movie.genre.map(g => (
                                    <span key={g} className="text-xs bg-white/5 border border-white/10 px-2 py-1 rounded-full">
                                        {g}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Plot */}
                        {movie.plot && (
                            <p className="text-[var(--fg)]/80 leading-relaxed max-w-2xl">
                                {movie.plot}
                            </p>
                        )}

                        {/* No Download Notice */}
                        <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-200 px-4 py-3 rounded-lg text-sm">
                            ⚠️ Not available to download, you can watch online!
                        </div>

                        {/* External Links - Same style as catalogue pages */}
                        <div className="flex flex-wrap gap-3">
                            <a
                                href={`https://letterboxd.com/search/${encodeURIComponent(movie.title)}/`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="glossy-box social-link letterboxd flex-1"
                            >
                                <span className="text-xl mr-2">●</span> Letterboxd
                            </a>
                            <a
                                href={`https://www.imdb.com/find/?q=${encodeURIComponent(movie.title + (movie.year ? ' ' + movie.year : ''))}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="glossy-box social-link imdb flex-1"
                            >
                                <span className="font-black text-lg mr-2">IMDb</span>
                            </a>
                            <a
                                href={`https://www.google.com/search?q=${encodeURIComponent(movie.title + (movie.year ? ' ' + movie.year : '') + ' movie')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="glossy-box social-link google flex-1"
                            >
                                Google
                            </a>
                        </div>
                    </div>
                </div>

                {/* Streaming Player */}
                <div className="mt-12">
                    <StreamingPlayer tmdbId={tmdbId} title={movie.title} year={movie.year} />
                </div>
            </div>

            {/* Spacer */}
            <div className="h-24"></div>
        </main>
    );
}
