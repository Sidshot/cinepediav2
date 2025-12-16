import dbConnect from '@/lib/mongodb';
import Movie from '@/models/Movie';
import MovieGrid from '@/components/MovieGrid';
import staticData from '@/lib/movies.json';
import Hero from '@/components/Hero';
import ActionFABs from '@/components/ActionFABs';

// Pagination config
const MOVIES_PER_PAGE = 48;

// Server Component
export default async function Home({ searchParams }) {
  // Await searchParams for Next.js 15 compatibility
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params?.page) || 1);

  let serializedMovies = [];
  let totalCount = 0;
  let totalPages = 1;
  let heroMovies = []; // Separate sample for Hero (random selection)

  try {
    if (process.env.MONGODB_URI) {
      await dbConnect();

      // Get total count for pagination
      totalCount = await Movie.countDocuments({});
      totalPages = Math.ceil(totalCount / MOVIES_PER_PAGE);

      // Fetch paginated movies
      const skip = (currentPage - 1) * MOVIES_PER_PAGE;
      const movies = await Movie.find({})
        .select('title year director ratingSum ratingCount __id addedAt letterboxd backdrop poster downloadLinks dl drive')
        .sort({ addedAt: -1 })
        .skip(skip)
        .limit(MOVIES_PER_PAGE)
        .lean();

      serializedMovies = movies.map(doc => {
        const d = { ...doc };
        d._id = d._id.toString();
        if (d.addedAt) d.addedAt = d.addedAt.toISOString();

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
    } else {
      throw new Error("No Mongo URI");
    }
  } catch (error) {
    console.warn('⚠️ Database connection failed or missing. Using Static Fallback.');
    // Fallback: paginate static data
    totalCount = staticData.length;
    totalPages = Math.ceil(totalCount / MOVIES_PER_PAGE);
    const skip = (currentPage - 1) * MOVIES_PER_PAGE;
    serializedMovies = staticData.slice(skip, skip + MOVIES_PER_PAGE);
    heroMovies = staticData.filter(m => m.backdrop).slice(0, 10);
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
      <div className="flex justify-between items-center pb-4 mb-4 border-b border-[var(--border)]">
        <h2 className="text-2xl font-bold text-[var(--fg)]">Library</h2>
        <span className="text-sm text-[var(--muted)]">{totalCount.toLocaleString()} films</span>
      </div>

      <MovieGrid
        initialMovies={serializedMovies}
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
      />

      {/* Floating Action Buttons */}
      <ActionFABs />
    </main>
  );
}
