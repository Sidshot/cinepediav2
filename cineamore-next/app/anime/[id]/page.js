import { getSeriesDetails, getSeasonDetails } from '@/lib/tmdb';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SeriesStreamingPlayer from '@/components/SeriesStreamingPlayer';

// ISR: Revalidate pages every hour
export const revalidate = 86400; // QUOTA FIX: 24 hours

export default async function AnimeDetailPage({ params, searchParams }) {
    const { id } = await params;
    const tmdbId = parseInt(id, 10);

    if (isNaN(tmdbId)) {
        notFound();
    }

    const series = await getSeriesDetails(tmdbId);

    if (series.error) {
        notFound();
    }

    // Get selected season/episode from URL or default to first
    const awaitedSearchParams = await searchParams;
    const selectedSeason = parseInt(awaitedSearchParams?.s) || 1;
    const selectedEpisode = parseInt(awaitedSearchParams?.e) || 1;

    // Fetch season details
    const seasonData = await getSeasonDetails(tmdbId, selectedSeason);

    return (
        <main className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
            {/* Hero with Backdrop */}
            <div className="relative w-full h-[50vh] overflow-hidden">
                {series.backdropUrl && (
                    <img
                        src={series.backdropUrl}
                        alt={series.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-40"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/60 to-transparent" />

                {/* Back Button */}
                <Link
                    href="/anime"
                    className="absolute top-6 left-6 z-20 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full text-white hover:bg-white/20 transition-colors"
                >
                    ← Back to Anime
                </Link>
            </div>

            {/* Content */}
            <div className="relative -mt-48 z-10 px-4 md:px-8 max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Poster */}
                    <div className="shrink-0 w-[200px] md:w-[280px]">
                        {series.posterUrl ? (
                            <div className="relative">
                                <img
                                    src={series.posterUrl}
                                    alt={series.title}
                                    className="w-full rounded-2xl shadow-2xl border border-white/10"
                                />
                                {/* Rating Badge */}
                                <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xl">
                                    <span className="text-yellow-400 text-base">★</span>
                                    <span className="text-white text-sm font-bold">
                                        {series.tmdbRating > 0 ? series.tmdbRating.toFixed(1) : 'NR'}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full aspect-[2/3] rounded-2xl bg-[var(--card-bg)] flex items-center justify-center border border-white/10">
                                <span className="text-[var(--muted)]">No Poster</span>
                            </div>
                        )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 space-y-4">
                        {/* Stream Only Badge - Red */}
                        <div className="inline-block bg-gradient-to-r from-red-600 to-pink-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                            📺 ANIME • STREAM ONLY
                        </div>

                        <h1 className="text-3xl md:text-5xl font-extrabold text-white">
                            {series.title}
                        </h1>

                        {series.original && series.original !== series.title && (
                            <p className="text-lg text-[var(--muted)] italic">{series.original}</p>
                        )}

                        <div className="flex flex-wrap gap-3 items-center">
                            {series.year && (
                                <span className="bg-red-600 text-white px-3 py-1 rounded-md font-bold text-sm">
                                    {series.year}{series.endYear && series.endYear !== series.year ? ` - ${series.endYear}` : ''}
                                </span>
                            )}
                            {series.numberOfSeasons > 0 && (
                                <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-md text-sm border border-white/20">
                                    {series.numberOfSeasons} Season{series.numberOfSeasons > 1 ? 's' : ''}
                                </span>
                            )}
                            {series.numberOfEpisodes > 0 && (
                                <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-md text-sm border border-white/20">
                                    {series.numberOfEpisodes} Episodes
                                </span>
                            )}
                            {series.status && (
                                <span className={`px-3 py-1 rounded-md text-sm font-medium ${series.status === 'Ended' ? 'bg-red-500/20 text-red-400' :
                                    series.status === 'Returning Series' ? 'bg-green-500/20 text-green-400' :
                                        'bg-white/10 text-white/80'
                                    }`}>
                                    {series.status}
                                </span>
                            )}
                        </div>

                        {/* Creator */}
                        {series.creator && (
                            <p className="text-[var(--muted)]">
                                Created by <span className="text-white font-medium">{series.creator}</span>
                            </p>
                        )}

                        {/* Networks */}
                        {series.networks && series.networks.length > 0 && (
                            <p className="text-[var(--muted)]">
                                On: <span className="text-white">{series.networks.join(', ')}</span>
                            </p>
                        )}

                        {/* Genres */}
                        {series.genre && series.genre.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {series.genre.map(g => (
                                    <span key={g} className="text-xs bg-white/5 border border-white/10 px-2 py-1 rounded-full">
                                        {g}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Plot */}
                        {series.plot && (
                            <p className="text-[var(--fg)]/80 leading-relaxed max-w-2xl">
                                {series.plot}
                            </p>
                        )}

                        {/* No Download Notice */}
                        <div className="bg-red-600/10 border border-red-600/30 text-red-200 px-4 py-3 rounded-lg text-sm">
                            📺 This is a streaming-only title. No download links available.
                        </div>

                        {/* External Links */}
                        <div className="flex flex-wrap gap-3">
                            <a
                                href={`https://letterboxd.com/search/${encodeURIComponent(series.title)}/`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="glossy-box social-link letterboxd flex-1"
                            >
                                <span className="text-xl mr-2">●</span> Letterboxd
                            </a>
                            <a
                                href={`https://www.imdb.com/find/?q=${encodeURIComponent(series.title + (series.year ? ' ' + series.year : ''))}&s=tt&ttype=tv`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="glossy-box social-link imdb flex-1"
                            >
                                <span className="font-black text-lg mr-2">IMDb</span>
                            </a>
                            <a
                                href={`https://www.google.com/search?q=${encodeURIComponent(series.title + ' Anime')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="glossy-box social-link google flex-1"
                            >
                                Google
                            </a>
                        </div>
                    </div>
                </div>

                {/* Season/Episode Selector */}
                <div className="mt-12">
                    <h3 className="text-xl font-bold text-white mb-4">Seasons & Episodes</h3>

                    {/* Season Tabs - Red theme */}
                    <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                        {series.seasons.map(season => (
                            <Link
                                key={season.seasonNumber}
                                href={`/anime/${tmdbId}?s=${season.seasonNumber}&e=1`}
                                className={`shrink-0 px-4 py-2 rounded-lg font-medium transition-colors ${selectedSeason === season.seasonNumber
                                    ? 'bg-red-600 text-white'
                                    : 'bg-white/5 text-[var(--muted)] hover:bg-white/10'
                                    }`}
                            >
                                S{season.seasonNumber}
                            </Link>
                        ))}
                    </div>

                    {/* Episodes - Red theme */}
                    {seasonData && seasonData.episodes && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {seasonData.episodes.map(ep => (
                                <Link
                                    key={ep.episodeNumber}
                                    href={`/anime/${tmdbId}?s=${selectedSeason}&e=${ep.episodeNumber}`}
                                    className={`p-4 rounded-xl border transition-all ${selectedEpisode === ep.episodeNumber
                                        ? 'bg-red-600/20 border-red-600/50'
                                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                                        }`}
                                >
                                    <div className="flex gap-3">
                                        {ep.stillUrl && (
                                            <img
                                                src={ep.stillUrl}
                                                alt={ep.name}
                                                className="w-24 h-14 object-cover rounded-lg shrink-0"
                                            />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-red-400 font-medium">Episode {ep.episodeNumber}</p>
                                            <h4 className="font-bold text-white truncate">{ep.name}</h4>
                                            {ep.runtime && <p className="text-xs text-[var(--muted)]">{ep.runtime} min</p>}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Streaming Player */}
                <div className="mt-12">
                    <SeriesStreamingPlayer
                        tmdbId={tmdbId}
                        title={series.title}
                        season={selectedSeason}
                        episode={selectedEpisode}
                    />
                </div>
            </div>

            {/* Spacer */}
            <div className="h-24"></div>
        </main>
    );
}
