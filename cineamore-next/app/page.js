import dbConnect from '@/lib/mongodb';
import Movie from '@/models/Movie';
import MovieGrid from '@/components/MovieGrid';
import { getBackdropUrl } from '@/lib/images';
import staticData from '@/lib/movies.json';

// Server Component
export default async function Home() {
  let serializedMovies = [];

  try {
    if (process.env.MONGODB_URI) {
      await dbConnect();
      const movies = await Movie.find({})
        .select('title year director ratingSum ratingCount __id addedAt')
        .sort({ addedAt: -1 })
        .lean();

      serializedMovies = movies.map(doc => {
        const d = { ...doc };
        d._id = d._id.toString();
        if (d.addedAt) d.addedAt = d.addedAt.toISOString();
        return d;
      });
    } else {
      throw new Error("No Mongo URI");
    }
  } catch (error) {
    console.warn('⚠️ Database connection failed or missing. Using Static Fallback.');
    serializedMovies = staticData;
  }

  // Select a random movie for "A Film For You"
  const randomMovie = serializedMovies.length > 0
    ? serializedMovies[Math.floor(Math.random() * serializedMovies.length)]
    : null;

  return (
    <main className="min-h-screen p-8 max-w-[1600px] mx-auto">
      {/* Hero Header Port (Static for now) */}
      <section className="relative w-full h-[50vh] min-h-[400px] flex items-end p-10 mb-10 rounded-3xl overflow-hidden shadow-2xl bg-[var(--card-bg)] group">
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>

        {/* Background Image */}
        {randomMovie && (
          <img
            src={getBackdropUrl(randomMovie.title, randomMovie.year, randomMovie.backdrop)}
            alt="Featured Background"
            className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-[3s]"
          />
        )}

        {/* Content */}
        <div className="relative z-20 w-full max-w-4xl animate-in slide-in-from-bottom-10 fade-in duration-700">
          <div className="text-[var(--accent)] text-sm font-bold tracking-widest uppercase mb-2 drop-shadow-md">✨ A Film For You</div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 leading-tight drop-shadow-lg">
            {randomMovie ? randomMovie.title : "Infinite Cinema"}
          </h1>
          <div className="flex gap-4 items-center mb-6 text-white/90 text-lg">
            {randomMovie ? (
              <>
                <span className="bg-[var(--accent)] text-[var(--bg)] px-3 py-1 rounded-md font-bold text-xs">{randomMovie.year}</span>
                <span className="backdrop-blur-md bg-white/10 px-3 py-1 rounded-md text-sm border border-white/20">{randomMovie.director}</span>
              </>
            ) : (
              <span className="bg-[var(--accent)] text-[var(--bg)] px-3 py-1 rounded-md font-bold text-xs">V2 BETA</span>
            )}
          </div>
        </div>
      </section>

      {/* Client Grid Handles Search/Sort */}
      <div className="flex justify-between items-center pb-4 mb-4 border-b border-[var(--border)]">
        <h2 className="text-2xl font-bold text-[var(--fg)]">Library</h2>
      </div>

      <MovieGrid initialMovies={serializedMovies} />
    </main>
  );
}
