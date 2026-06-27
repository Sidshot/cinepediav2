import { sendPhoto } from '@/lib/telegram';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';
import { getTrendingSeries, getTrendingAnime } from '@/lib/tmdb';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://cinepediav2.vercel.app').replace(/\/$/, '');

/**
 * Posts the daily recommendations (1 Movie, 1 Series, 1 Anime) to the configured chat.
 * @param {string} targetChatId - Optional override for the chat ID
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function postDailyRecommendations(targetChatId = null) {
    try {
        await dbConnect();
        const db = mongoose.connection.db;
        const chatId = targetChatId || process.env.TELEGRAM_CHAT_ID;

        if (!chatId) {
            return { ok: false, error: 'TELEGRAM_CHAT_ID not configured' };
        }

        // ============ 1. POST RANDOM MOVIE FROM DATABASE ============
        const [randomMovie] = await db.collection('movies').aggregate([{ $sample: { size: 1 } }]).toArray();

        if (randomMovie) {
            const movieId = randomMovie.__id || randomMovie._id.toString();
            const caption = `
🎬 <b>Film of the Day</b>
<b>${randomMovie.title}</b> (${randomMovie.year || 'N/A'})

${randomMovie.plot ? randomMovie.plot.substring(0, 150) + '...' : ''}

📥 <b>Download</b> or 📡 <b>Stream</b> here:
${SITE_URL}/movie/${movieId}
`;
            await sendPhoto(chatId, randomMovie.posterUrl, caption);
        }

        // ============ 2. POST TRENDING SERIES FROM TMDB ============
        try {
            const trendingSeries = await getTrendingSeries();
            if (trendingSeries && trendingSeries.length > 0) {
                // Pick a random one from top 10
                const randomIndex = Math.floor(Math.random() * Math.min(10, trendingSeries.length));
                const series = trendingSeries[randomIndex];

                const posterUrl = series.poster_path
                    ? `https://image.tmdb.org/t/p/w500${series.poster_path}`
                    : `${SITE_URL}/og-image.png`;

                const caption = `
📺 <b>Series Recommendation</b>
<b>${series.name}</b> (${series.first_air_date?.substring(0, 4) || 'N/A'})

${series.overview ? series.overview.substring(0, 150) + '...' : ''}

📡 <b>Stream Now:</b>
${SITE_URL}/series/${series.id}
`;
                await sendPhoto(chatId, posterUrl, caption);
            }
        } catch (e) {
            console.log('[Daily Recs] Series fetch failed:', e.message);
        }

        // ============ 3. POST TRENDING ANIME FROM TMDB ============
        try {
            const trendingAnime = await getTrendingAnime();
            if (trendingAnime && trendingAnime.length > 0) {
                // Pick a random one from top 10
                const randomIndex = Math.floor(Math.random() * Math.min(10, trendingAnime.length));
                const anime = trendingAnime[randomIndex];

                const posterUrl = anime.poster_path
                    ? `https://image.tmdb.org/t/p/w500${anime.poster_path}`
                    : `${SITE_URL}/og-image.png`;

                const caption = `
👺 <b>Anime Pick</b>
<b>${anime.name}</b>

📡 <b>Stream Now:</b>
${SITE_URL}/anime/${anime.id}
`;
                await sendPhoto(chatId, posterUrl, caption);
            }
        } catch (e) {
            console.log('[Daily Recs] Anime fetch failed:', e.message);
        }

        return { ok: true };
    } catch (e) {
        console.error('[Daily Recs] Error:', e);
        return { ok: false, error: e.message };
    }
}
