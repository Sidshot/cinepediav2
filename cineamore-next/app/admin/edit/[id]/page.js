import MovieForm from '@/components/MovieForm';
import { updateMovie } from '@/lib/actions';
import dbConnect from '@/lib/mongodb';
import Movie from '@/models/Movie';
import { notFound } from 'next/navigation';
import mongoose from 'mongoose';

export default async function EditMoviePage({ params }) {
    await dbConnect();
    const { id } = await params; // Next 15

    let movie;
    if (mongoose.Types.ObjectId.isValid(id)) {
        movie = await Movie.findById(id).lean();
    } else {
        // Fallback or error if not ObjectId (though new system uses ObjectIds)
        // For legacy parity we could search __id, but for editing let's enforce _id usage in URL
        movie = await Movie.findOne({ __id: id }).lean();
    }

    if (!movie) notFound();

    // Serialize for Client Component
    // This handles _id, Dates, and nested ObjectIDs automatically
    const serializedMovie = JSON.parse(JSON.stringify(movie));
    const updateAction = updateMovie.bind(null, serializedMovie._id);

    return (
        <main className="min-h-screen p-8 max-w-7xl mx-auto bg-[var(--bg)] flex flex-col items-center">
            <div className="w-full max-w-2xl mb-8">
                <a href="/admin" className="text-[var(--muted)] hover:text-[var(--fg)] text-sm mb-4 inline-block transition">
                    ← Back to Dashboard
                </a>
                <h1 className="text-3xl font-extrabold text-[var(--fg)]">Edit Movie</h1>
                <p className="text-[var(--muted)]">Updating details for {serializedMovie.title}.</p>
            </div>

            <MovieForm action={updateAction} defaultValues={serializedMovie} />
        </main>
    );
}
