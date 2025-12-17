import dbConnect from '@/lib/mongodb';
import Movie from '@/models/Movie';
import MovieGrid from '@/components/MovieGrid';
import staticData from '@/lib/movies.json';
import Hero from '@/components/Hero';
import ActionFABs from '@/components/ActionFABs';

// Pagination config
const MOVIES_PER_PAGE = 48;

export const dynamic = 'force-dynamic';

// Server Component
export default async function Home({ searchParams }) {
  // Await searchParams for Next.js 15 compatibility
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params?.page) || 1);
  const currentGenre = params?.genre || null;

  let serializedMovies = [];
  let totalCount = 0;
  let totalPages = 1;
  let heroMovies = []; // Separate sample for Hero (random selection)
  let allGenres = []; // Unique genres for filter tiles

  try {
    if (process.env.MONGODB_URI) {
      await dbConnect();

      // Fetch paginated movies
      const genreFilter = params?.genre || null;
      // If filtering by genre, show 50 per page. Otherwise default to 48.
      const perPage = genreFilter ? 50 : MOVIES_PER_PAGE;
      const skip = (currentPage - 1) * perPage;

      const query = {};
      if (genreFilter && genreFilter !== 'all') {
        query.genre = genreFilter;
      }

      totalCount = await Movie.countDocuments(query);
      totalPages = Math.ceil(totalCount / perPage);

      const movies = await Movie.find(query)
        .select('title year director ratingSum ratingCount __id addedAt letterboxd backdrop poster downloadLinks dl drive genre')
        .sort({ addedAt: -1 })
        .skip(skip)
        .limit(perPage)
        .lean();

      serializedMovies = movies.map(doc => {
        const d = { ...doc };
        d._id = d._id.toString();
        if (d.addedAt && typeof d.addedAt.toISOString === 'function') {
          d.addedAt = d.addedAt.toISOString();
        } else if (d.addedAt) {
          d.addedAt = new Date(d.addedAt).toISOString();
        }

        // Deep serialize subdocuments (downloadLinks)
        if (d.downloadLinks && Array.isArray(d.downloadLinks)) {
          d.downloadLinks = d.downloadLinks.map(link => ({
            ...link,
            _id: link._id ? link._id.toString() : undefined,
            addedAt: link.addedAt ? link.addedAt.toISOString() : undefined
          }));
        }

        return d;
      });

      if (serializedMovies.length > 0) {
        // console.log('Serialized movie:', serializedMovies[0]);
      }

      // Fetch a small random sample for Hero (only on page 1 to avoid extra queries)
      if (currentPage === 1) {
        const heroSample = await Movie.aggregate([
          { $match: { backdrop: { $exists: true, $ne: null, $ne: '' } } },
          { $sample: { size: 10 } },
          { $project: { title: 1, year: 1, director: 1, backdrop: 1, poster: 1, __id: 1 } }
        ]);
        heroMovies = heroSample.map(doc => ({
          ...doc,
          _id: doc._id.toString()
        }));
      }

      // Aggregate unique genres for filter tiles
      const genreAgg = await Movie.aggregate([
        { $unwind: '$genre' },
        { $group: { _id: '$genre' } },
        { $sort: { _id: 1 } }
      ]);
      allGenres = genreAgg.map(g => g._id).filter(g => g && g !== 'Uncategorized');
    } else {
      throw new Error("No Mongo URI");
    }
  } catch (error) {
    console.warn('⚠️ Database connection failed or missing. Using Static Fallback.', error.message);
    // Fallback: paginate static data
    // Fallback: paginate static data
    let filteredStatic = staticData;

    // 1. Filter by Genre if exists
    if (genreFilter && genreFilter !== 'all') {
      filteredStatic = staticData.filter(m =>
        m.genre && m.genre.some(g => g.toLowerCase() === genreFilter.toLowerCase())
      );
    }

    // 2. Calculate Counts
    totalCount = filteredStatic.length;
    totalPages = Math.ceil(totalCount / perPage);

    // 3. Paginate
    const skip = (currentPage - 1) * perPage;
    serializedMovies = filteredStatic.slice(skip, skip + perPage);

    heroMovies = staticData.filter(m => m.backdrop).slice(0, 10);

    // Extract genres from static data
    const genreSet = new Set();
    staticData.forEach(m => (m.genre || []).forEach(g => g && g !== 'Uncategorized' && genreSet.add(g)));
    allGenres = Array.from(genreSet).sort();
  }

  // Deduplicate by _id to prevent React key errors
  const uniqueMovies = new Map();
  serializedMovies.forEach(m => {
    uniqueMovies.set(m._id || m.__id, m);
  });
  serializedMovies = Array.from(uniqueMovies.values());

  return (
    <main className="min-h-screen p-8 max-w-[1600px] mx-auto">
      {/* Client Hero handling Randomization (only on page 1) */}
      {currentPage === 1 && <Hero movies={heroMovies.length > 0 ? heroMovies : serializedMovies.slice(0, 10)} />}

      {/* Client Grid Handles Search/Sort */}
      {/* Client Grid Handles Search/Sort */}
      {/* Header Removed as per UI update */}

      <MovieGrid
        initialMovies={serializedMovies}
        allGenres={allGenres}
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        currentGenre={currentGenre}
      />

      {/* Floating Action Buttons */}
      <ActionFABs />
    </main>
  );
}
