import dbConnect from './mongodb';
import Movie from '@/models/Movie';

// Simple seeded random generator based on current date string
function seededRandom(seed) {
    let h = 0xdeadbeef;
    for (let i = 0; i < seed.length; i++) {
        h = Math.imul(h ^ seed.charCodeAt(i), 2654435761);
    }
    h = ((h ^ h >>> 16) >>> 0) / 4294967296;
    return h;
}

// Fisher-Yates shuffle with seeded random
function seededShuffle(array, seedStr) {
    let m = array.length, t, i;
    let seedVal = seededRandom(seedStr);

    // Create a deterministic pseudo-random sequence from the seed
    const random = () => {
        seedVal = (seedVal * 9301 + 49297) % 233280;
        return seedVal / 233280;
    };

    while (m) {
        i = Math.floor(random() * m--);
        t = array[m];
        array[m] = array[i];
        array[i] = t;
    }
    return array;
}

export async function getDailyTrending() {
    await dbConnect();

    // 1. Get Pool of High Rated Movies (> 6)
    // We sort by rating desc first to ensure we get the "good stuff" from DB
    // Limit to 50 to have a pool to shuffle from
    const candidates = await Movie.find({
        tmdbRating: { $gt: 6 },
        'visibility.state': 'visible'
    })
        .sort({ tmdbRating: -1 })
        .limit(50)
        .lean();

    // Fallback: If not enough rated movies, grab recently added
    let pool = candidates;
    if (pool.length < 5) {
        pool = await Movie.find({ 'visibility.state': 'visible' })
            .sort({ addedAt: -1 })
            .limit(20)
            .lean();
    }

    // 2. Shuffle based on Date (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];
    const shuffled = seededShuffle([...pool], today);

    // 3. Return Top 10
    // Serialize ID
    return shuffled.slice(0, 10).map(m => ({
        ...m,
        _id: m._id.toString()
    }));
}
