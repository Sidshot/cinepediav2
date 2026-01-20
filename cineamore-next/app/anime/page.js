import { getTrendingAnime, getPopularAnime, getTopRatedAnime, getAnimeByGenre } from '@/lib/tmdb';
import { ANIME_GENRES } from '@/lib/anime-genres';
import AnimeHero from '@/components/AnimeHero';
import AnimeGenreRow from '@/components/AnimeGenreRow';

// ISR: Cache page for 1 hour
export const revalidate = 86400; // QUOTA FIX: 24 hours

export default async function AnimePage() {
    // Fetch anime data with safe fallbacks
    let trending = [];
    let popular = [];
    let topRated = [];
    let genreRows = [];

    try {
        const results = await Promise.allSettled([
            getTrendingAnime(),
            getPopularAnime(),
            getTopRatedAnime()
        ]);

        trending = results[0].status === 'fulfilled' ? (Array.isArray(results[0].value) ? results[0].value : []) : [];
        popular = results[1].status === 'fulfilled' ? (Array.isArray(results[1].value) ? results[1].value : []) : [];
        topRated = results[2].status === 'fulfilled' ? (Array.isArray(results[2].value) ? results[2].value : []) : [];
    } catch (e) {
        console.error('Anime page main fetch error:', e);
    }

    // Fetch genre rows (limit to 4 to reduce API load)
    try {
        const genreResults = await Promise.allSettled(
            ANIME_GENRES.slice(0, 4).map(async genre => ({
                title: genre.name,
                genreId: genre.id,
                series: await getAnimeByGenre(genre.id)
            }))
        );
        genreRows = genreResults
            .filter(r => r.status === 'fulfilled' && Array.isArray(r.value?.series))
            .map(r => r.value)
            .filter(row => row.series.length > 0);
    } catch (e) {
        console.error('Anime page genre fetch error:', e);
    }

    // Random hero from trending
    const heroSeries = trending.length > 0
        ? trending[Math.floor(Math.random() * Math.min(5, trending.length))]
        : null;

    return (
        <main className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
            {/* Hero + Search + Genre Pills */}
            <AnimeHero heroSeries={heroSeries} />

            {/* Genre Rows with View All */}
            <div className="mt-4">
                <AnimeGenreRow
                    title="Trending This Week"
                    genreId={null}
                    series={trending}
                />
                <AnimeGenreRow
                    title="Popular Anime"
                    genreId={null}
                    series={popular}
                />
                <AnimeGenreRow
                    title="Top Rated"
                    genreId={null}
                    series={topRated}
                />

                {/* Genre-specific rows with View All buttons */}
                {genreRows.map((row, i) => (
                    <AnimeGenreRow
                        key={row.genreId || i}
                        title={row.title}
                        genreId={row.genreId}
                        series={row.series}
                    />
                ))}
            </div>

            {/* Notice */}
            <div className="text-center py-8 text-[var(--muted)] text-sm">
                All anime content is provided via streaming only. No download links available.
            </div>
        </main>
    );
}
