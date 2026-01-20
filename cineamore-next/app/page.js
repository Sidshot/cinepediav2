import dbConnect from '@/lib/mongodb';
import Movie from '@/models/Movie';
import MovieGrid from '@/components/MovieGrid';
import GenreRow from '@/components/GenreRow';
import staticData from '@/lib/movies.json';
import Hero from '@/components/Hero';
import ActionFABs from '@/components/ActionFABs';
import OptimizedPoster from '@/components/OptimizedPoster';
import PromoBanner from '@/components/PromoBanner';
import Link from 'next/link';
import TrendingRow from '@/components/TrendingRow';
import {
  getCachedGenres,
  getCachedHeroMovies,
  getCachedRecentlyAdded,
  getCachedTrending,
  getCachedGenreRows
} from '@/lib/homeData';

// Pagination config
const MOVIES_PER_PAGE = 48;
const HOME_GENRES = ['Action', 'Adventure', 'Comedy', 'Crime', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'Animation'];

export const revalidate = 86400; // QUOTA FIX: ISR - Cache homepage for 24 hours

// Helper to serialize Mongoose docs
const serializeMovie = (doc) => {
  const d = { ...doc };
  if (d._id) d._id = d._id.toString?.() || String(d._id);
  // Safe date serialization
  if (d.addedAt && typeof d.addedAt.toISOString === 'function') {
    d.addedAt = d.addedAt.toISOString();
  } else if (d.addedAt) {
    d.addedAt = new Date(d.addedAt).toISOString();
  }

  // Explicitly serialize downloadLinks to avoid ObjectId/Date issues
  if (d.downloadLinks && Array.isArray(d.downloadLinks)) {
    d.downloadLinks = d.downloadLinks.map(link => ({
      label: link.label || 'Download',
      url: link.url || '',
      _id: link._id ? (link._id.toString?.() || String(link._id)) : undefined,
      addedAt: link.addedAt ? (link.addedAt.toISOString?.() || new Date(link.addedAt).toISOString()) : undefined
    }));
  }
  return d;
};

// Server Component
// Suspense Wrapper to handle searchParams in Static/ISR mode
import { Suspense } from 'react';
import GlobalLoader from '@/components/GlobalLoader';

export default function HomeWrapper(props) {
  return (
    <Suspense fallback={<GlobalLoader />}>
      <Home {...props} />
    </Suspense>
  );
}

async function Home({ searchParams }) {
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params?.page) || 1);
  const currentGenre = params?.genre || null;
  const searchQuery = params?.q || null;
  const sortBy = params?.sort || 'year-desc';

  // Determine View Mode
  const isDefaultView = !searchQuery && !currentGenre && currentPage === 1 && sortBy === 'year-desc';

  let serializedMovies = [];
  let totalCount = 0;
  let totalPages = 1;
  let heroMovies = [];
  let allGenres = [];
  let recentlyAdded = [];
  let genreRowsData = []; // Array of { title, movies }
  let isOffline = false;
  let trendingMovies = []; // Safe init

  try {
    if (process.env.MONGODB_URI) {

      // 0. Fetch Daily Trending (Cached)
      try {
        trendingMovies = await getCachedTrending();
      } catch (e) {
        console.error("Trending Fetch failed:", e);
      }

      // 1. Fetch Global Data (Cached)
      allGenres = await getCachedGenres();

      if (isDefaultView) {
        // --- DEFAULT VIEW STRATEGY (CACHED) ---

        // Parallel Fetch for Speed
        const [heroData, recentData, rowData] = await Promise.all([
          getCachedHeroMovies(),
          getCachedRecentlyAdded(),
          getCachedGenreRows(HOME_GENRES)
        ]);

        heroMovies = heroData;
        recentlyAdded = recentData;
        genreRowsData = rowData;

      } else {
        // --- FILTERED / PAGINATED VIEW STRATEGY (DYNAMIC - NO CACHE) ---
        // This part remains dynamic as it depends on user queries
        await dbConnect(); // Ensure connection for dynamic queries

        const query = { 'visibility.state': 'visible' };
        if (currentGenre && currentGenre !== 'all' && currentGenre !== 'newest') {
          query.genre = currentGenre;
        }
        if (searchQuery && searchQuery.trim()) {
          const searchRegex = { $regex: searchQuery.trim(), $options: 'i' };
          query.$or = [
            { title: searchRegex },
            { director: searchRegex },
            { original: searchRegex }
          ];
        }

        let sortObj = { addedAt: -1 };
        switch (sortBy) {
          case 'newest': sortObj = { addedAt: -1 }; break;
          case 'oldest': sortObj = { addedAt: 1 }; break;
          case 'year-desc': sortObj = { year: -1, addedAt: -1 }; break;
          case 'year-asc': sortObj = { year: 1, addedAt: -1 }; break;
          default: sortObj = { addedAt: -1 };
        }

        const skip = (currentPage - 1) * MOVIES_PER_PAGE;
        totalCount = await Movie.countDocuments(query);
        totalPages = Math.ceil(totalCount / MOVIES_PER_PAGE);

        const moviesDocs = await Movie.find(query)
          .select('title year director ratingSum ratingCount __id addedAt letterboxd backdrop poster downloadLinks dl drive genre original')
          .slice('downloadLinks', 1)
          .sort(sortObj)
          .skip(skip)
          .limit(MOVIES_PER_PAGE)
          .lean();

        serializedMovies = moviesDocs.map(serializeMovie);
      }

    } else {
      throw new Error("No Mongo URI");
    }
  } catch (error) {
    console.warn('⚠️ Database connection failed or missing. Using Static Fallback.', error.message);
    isOffline = true;

    // Static Fallback Logic
    const genreSet = new Set();
    staticData.forEach(m => (m.genre || []).forEach(g => g && g !== 'Uncategorized' && genreSet.add(g)));
    allGenres = Array.from(genreSet).sort();

    if (isDefaultView) {
      recentlyAdded = staticData.slice(0, 18).map(serializeMovie);
      heroMovies = staticData.filter(m => m.backdrop).slice(0, 10);

      genreRowsData = HOME_GENRES.map(genre => ({
        title: genre,
        movies: staticData.filter(m => m.genre?.includes(genre)).slice(0, 18).map(serializeMovie)
      })).filter(r => r.movies.length > 0);
    } else {
      let filtered = staticData;
      if (currentGenre && currentGenre !== 'all') {
        filtered = filtered.filter(m => m.genre?.includes(currentGenre));
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(m =>
          m.title?.toLowerCase().includes(q) ||
          m.director?.toLowerCase().includes(q)
        );
      }

      if (sortBy === 'year-desc') filtered.sort((a, b) => (b.year || 0) - (a.year || 0));

      totalCount = filtered.length;
      totalPages = Math.ceil(totalCount / MOVIES_PER_PAGE);
      const skip = (currentPage - 1) * MOVIES_PER_PAGE;
      serializedMovies = filtered.slice(skip, skip + MOVIES_PER_PAGE).map(serializeMovie);
    }
  }

  // --- RENDER ---

  return (
    <main className="min-h-screen p-4 sm:p-8 pb-32 max-w-[1900px] mx-auto">
      {/* Promo Banner */}
      {isDefaultView && <PromoBanner />}

      {isOffline && (
        <div className="mb-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-200 text-center font-bold flex items-center justify-center gap-2">
          <span>⚠️</span>
          <span>Database connection failed. Viewing offline copy.</span>
        </div>
      )}

      {/* Hero Section */}
      {isEmpty(searchQuery) && (
        <Hero movies={heroMovies.length > 0 ? heroMovies : (isDefaultView ? recentlyAdded.slice(0, 10) : serializedMovies.slice(0, 10))} />
      )}

      {/* VIEW A: Default Genre Rows */}
      {isDefaultView ? (
        <div className="animate-fade-in-up">
          {/* Search Bar Block (Reusing MovieGrid just for Search/Genre nav, passing empty movies to hide grid?) 
                Actually, simpler to render the Controls separately or use MovieGrid in a special "controls only" mode.
                Let's use MovieGrid but tell it NOT to render the grid if we are in default mode? 
                No, MovieGrid is tightly coupled. 
                Better approach: Render MovieGrid ALWAYS, but initialMovies is empty in Default View? 
                NO, because we want the Rows. 
                
                Solution: Render the "Search/Filter Header" here manually OR Refactor MovieGrid to export the Header.
                Let's reuse MovieGrid but give it 0 movies, and place the GenreRows AFTER it?
                No, the Request is: "Top is search and genre sorting option, below are film... category wise".
                So the Header must be visible.
            */}

          {/* We render MovieGrid strictly for the Header Controls. 
                We pass `initialMovies={[]}` so it renders no grid, but the controls work.
                Wait, if we pass empty array, it might show "No movies found".
                Let's assume we want the Filter UI. 
            */}
          {/* We render MovieGrid strictly for the Header Controls. 
              Sticky Wrapper: ensuring it stays on top while scrolling through genres.
              z-50 guarantees it's above everything.
          */}
          {/* We render MovieGrid strictly for the Header Controls. 
              The stickiness is now handled INTERNALLY by MovieGrid.js 
              to allow the Search Bar to stick while Genres scroll away.
          */}
          <div className="mb-8">
            <MovieGrid
              initialMovies={[]}
              allGenres={allGenres}
              currentPage={1}
              totalPages={0}
              totalCount={totalCount} // Doesn't matter here
              currentGenre={null}
              currentSearch={''}
              currentSort={'newest'}
              hideGrid={true} // We will add this prop to MovieGrid to hide results/empty state
            />
          </div>

          {/* 0. Top 10 Trending Row (Big Numbers) - NEW */}
          {trendingMovies.length > 0 && (
            <TrendingRow movies={trendingMovies} />
          )}

          {/* 1. Recently Added Row */}
          {recentlyAdded.length > 0 && (
            <GenreRow
              title="Recently Added"
              movies={recentlyAdded}
              viewAllUrl="/?sort=newest"
            />
          )}

          {/* 2. Genre Rows */}
          {genreRowsData.map((row) => (
            <GenreRow
              key={row.title}
              title={row.title}
              movies={row.movies}
              genreId={row.title}
            />
          ))}
        </div>
      ) : (
        /* VIEW B: Filtered Grid Result */
        <div className="animate-fade-in">
          {/* Back Button Context */}
          {(currentGenre || searchQuery) && (
            <div className="mb-4">
              <Link href="/" className="inline-flex items-center gap-2 text-[var(--muted)] hover:text-[var(--accent)] transition-colors font-bold">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Back to Home
              </Link>
            </div>
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
            hideGrid={false}
          />
        </div>
      )}

      <ActionFABs />
    </main>
  );
}

function isEmpty(str) {
  return !str || str.trim().length === 0;
}


