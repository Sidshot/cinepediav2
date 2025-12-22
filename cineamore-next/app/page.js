import dbConnect from '@/lib/mongodb';
import Movie from '@/models/Movie';
import MovieGrid from '@/components/MovieGrid';
import staticData from '@/lib/movies.json';
import Hero from '@/components/Hero';
import ActionFABs from '@/components/ActionFABs';
import { getProxyUrl } from '@/lib/image-proxy';
import OptimizedPoster from '@/components/OptimizedPoster';
import PromoBanner from '@/components/PromoBanner';

// Pagination config
const MOVIES_PER_PAGE = 48;

export const dynamic = 'force-dynamic';

// Server Component
export default async function Home({ searchParams }) {
  // Await searchParams for Next.js 15 compatibility
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params?.page) || 1);
  const currentGenre = params?.genre || null;
  const searchQuery = params?.q || null;
  const sortBy = params?.sort || 'year-desc'; // Default: newest films by year

  let serializedMovies = [];
  let totalCount = 0;
  let totalPages = 1;
  let heroMovies = [];
  let allGenres = [];
  let recentlyAdded = []; // NEW: Films from last import
  let isOffline = false;

  try {
    if (process.env.MONGODB_URI) {
      await dbConnect();

      // Build query object
      const query = {};

      // Genre filter
      if (currentGenre && currentGenre !== 'all') {
        query.genre = currentGenre;
      }

      // Search filter (searches title, director, and original title)
      if (searchQuery && searchQuery.trim()) {
        const searchRegex = { $regex: searchQuery.trim(), $options: 'i' };
        query.$or = [
          { title: searchRegex },
          { director: searchRegex },
          { original: searchRegex }
        ];
      }

      // Build sort object
      let sortObj = { addedAt: -1 }; // Default: newest first
      switch (sortBy) {
        case 'oldest':
          sortObj = { addedAt: 1 };
          break;
        case 'year-desc':
          sortObj = { year: -1, addedAt: -1 };
          break;
        case 'year-asc':
          sortObj = { year: 1, addedAt: -1 };
          break;
        default:
          sortObj = { addedAt: -1 };
      }

      // Pagination
      const perPage = MOVIES_PER_PAGE; // Strictly 48 per spec
      const skip = (currentPage - 1) * perPage;

      totalCount = await Movie.countDocuments(query);
      totalPages = Math.ceil(totalCount / perPage);

      const movies = await Movie.find(query)
        .select('title year director ratingSum ratingCount __id addedAt letterboxd backdrop poster downloadLinks dl drive genre original')
        .sort(sortObj)
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

      // Fetch recently added movies (added in last 24 hours)
      if (currentPage === 1 && !searchQuery && !currentGenre) {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentMovies = await Movie.find({ addedAt: { $gte: oneDayAgo } })
          .sort({ addedAt: -1 })
          .limit(20)
          .lean();

        recentlyAdded = recentMovies.map(doc => ({
          ...doc,
          _id: doc._id.toString(),
          addedAt: doc.addedAt?.toISOString?.() || doc.addedAt,
          downloadLinks: (doc.downloadLinks || []).map(link => ({
            ...link,
            _id: link._id?.toString(),
            addedAt: link.addedAt?.toISOString?.() || link.addedAt
          }))
        }));
      }
    } else {
      throw new Error("No Mongo URI");
    }
  } catch (error) {
    console.warn('⚠️ Database connection failed or missing. Using Static Fallback.', error.message);
    isOffline = true;
    // Fallback: paginate static data
    let filteredStatic = staticData;
    const perPage = MOVIES_PER_PAGE;

    // 1. Filter by Genre if exists
    if (currentGenre && currentGenre !== 'all') {
      filteredStatic = filteredStatic.filter(m =>
        m.genre && m.genre.some(g => g.toLowerCase() === currentGenre.toLowerCase())
      );
    }

    // 2. Search filter for static data
    if (searchQuery && searchQuery.trim()) {
      const sq = searchQuery.trim().toLowerCase();
      filteredStatic = filteredStatic.filter(m =>
        (m.title && m.title.toLowerCase().includes(sq)) ||
        (m.director && m.director.toLowerCase().includes(sq)) ||
        (m.original && m.original.toLowerCase().includes(sq))
      );
    }

    // 3. Sort static data
    switch (sortBy) {
      case 'oldest':
        filteredStatic = filteredStatic.sort((a, b) => new Date(a.addedAt || 0) - new Date(b.addedAt || 0));
        break;
      case 'year-desc':
        filteredStatic = filteredStatic.sort((a, b) => (b.year || 0) - (a.year || 0));
        break;
      case 'year-asc':
        filteredStatic = filteredStatic.sort((a, b) => (a.year || 0) - (b.year || 0));
        break;
      default:
        filteredStatic = filteredStatic.sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0));
    }

    // 4. Calculate Counts
    totalCount = filteredStatic.length;
    totalPages = Math.ceil(totalCount / perPage);

    // 5. Paginate
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
    <main className="min-h-screen p-8 pb-32 max-w-[1600px] mx-auto">
      {/* Promo Banner - only on homepage first page without search */}
      {currentPage === 1 && !searchQuery && !currentGenre && <PromoBanner />}

      {isOffline && (
        <div className="mb-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-200 text-center font-bold flex items-center justify-center gap-2">
          <span>⚠️</span>
          <span>Database connection failed. Viewing offline copy.</span>
        </div>
      )}
      {/* Client Hero handling Randomization (only on page 1 and no search active) */}
      {currentPage === 1 && !searchQuery && <Hero movies={heroMovies.length > 0 ? heroMovies : serializedMovies.slice(0, 10)} />}

      {/* Recently Added Section (only on page 1, no search/genre) */}
      {currentPage === 1 && !searchQuery && !currentGenre && recentlyAdded.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-[var(--fg)] mb-4 flex items-center gap-2">
            <span className="text-green-400">🆕</span> Recently Added
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {recentlyAdded.slice(0, 12).map(movie => (
              <a
                key={movie._id}
                href={`/movie/${movie.__id || movie._id}`}
                className="group bg-[var(--card-bg)] rounded-xl overflow-hidden border border-[var(--border)] hover:border-[var(--accent)] transition-all hover:scale-[1.02]"
              >
                <div className="aspect-[2/3] bg-[var(--card-bg)] relative flex items-center justify-center">
                  <OptimizedPoster
                    src={movie.poster}
                    title={movie.title}
                    year={movie.year}
                    className="w-full h-full"
                  />
                  <div className="absolute top-2 right-2 z-10 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold shadow">
                    NEW
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-bold text-sm text-[var(--fg)] truncate">{movie.title}</h3>
                  <p className="text-xs text-[var(--muted)]">{movie.year || '—'} • {movie.director || 'Unknown'}</p>
                </div>
              </a>
            ))}
          </div>
          {recentlyAdded.length > 12 && (
            <p className="text-center text-[var(--muted)] text-sm mt-4">
              +{recentlyAdded.length - 12} more added recently
            </p>
          )}
        </section>
      )}

      <MovieGrid
        initialMovies={serializedMovies}
        allGenres={allGenres}
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        currentGenre={currentGenre}
        currentSearch={searchQuery || ''}
        currentSort={sortBy}
      />

      {/* Floating Action Buttons */}
      <ActionFABs />
    </main>
  );
}

