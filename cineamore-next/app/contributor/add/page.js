import MovieForm from '@/components/MovieForm';
import { createPendingMovie } from '@/lib/contributorActions';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function ContributorAddPage() {
    const session = await getSession();
    if (!session || (session.role !== 'contributor' && session.role !== 'admin')) {
        redirect('/login');
    }

    return (
        <main className="min-h-screen p-8 max-w-7xl mx-auto bg-[var(--bg)] flex flex-col items-center">
            <div className="w-full max-w-2xl mb-8">
                <Link href="/contributor" className="text-[var(--muted)] hover:text-[var(--fg)] text-sm mb-4 inline-block transition">
                    ← Back to Dashboard
                </Link>
                <h1 className="text-3xl font-extrabold text-[var(--fg)]">Add New Movie</h1>
                <p className="text-[var(--muted)]">
                    Submit a movie for review.
                    <span className="text-orange-400 ml-1">Changes require admin approval.</span>
                </p>
            </div>

            {/* Info Banner */}
            <div className="w-full max-w-2xl mb-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-400 text-sm">
                <strong>📋 Pending Approval:</strong> Your submission will be reviewed by an admin before appearing in the library.
            </div>

            <MovieForm action={createPendingMovie} cancelUrl="/contributor" />
        </main>
    );
}
