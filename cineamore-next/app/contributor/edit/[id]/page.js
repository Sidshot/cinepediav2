import MovieForm from '@/components/MovieForm';
import { updatePendingMovie } from '@/lib/contributorActions';
import { getSession } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import dbConnect from '@/lib/mongodb';
import Movie from '@/models/Movie';
import mongoose from 'mongoose';
import Link from 'next/link';

export default async function ContributorEditPage({ params }) {
    const session = await getSession();
    if (!session || (session.role !== 'contributor' && session.role !== 'admin')) {
        redirect('/login');
    }

    await dbConnect();
    const { id } = await params;

    let movie;
    if (mongoose.Types.ObjectId.isValid(id)) {
        movie = await Movie.findById(id).lean();
    } else {
        movie = await Movie.findOne({ __id: id }).lean();
    }

    if (!movie) notFound();

    // Serialize for Client Component
    const serializedMovie = JSON.parse(JSON.stringify(movie));
    const updateAction = updatePendingMovie.bind(null, serializedMovie._id);

    return (
        <main className="min-h-screen p-8 max-w-7xl mx-auto bg-[var(--bg)] flex flex-col items-center">
            <div className="w-full max-w-2xl mb-8">
                <Link href="/contributor" className="text-[var(--muted)] hover:text-[var(--fg)] text-sm mb-4 inline-block transition">
                    ← Back to Dashboard
                </Link>
                <h1 className="text-3xl font-extrabold text-[var(--fg)]">Edit Movie</h1>
                <p className="text-[var(--muted)]">
                    Propose changes to <span className="text-[var(--fg)]">{serializedMovie.title}</span>.
                    <span className="text-orange-400 ml-1">Changes require admin approval.</span>
                </p>
            </div>

            {/* Info Banner */}
            <div className="w-full max-w-2xl mb-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-400 text-sm">
                <strong>📋 Pending Approval:</strong> Your changes will be reviewed before being applied.
            </div>

            <MovieForm action={updateAction} defaultValues={serializedMovie} cancelUrl="/contributor" />
        </main>
    );
}
