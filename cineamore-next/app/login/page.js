import { login } from '@/lib/auth';

export default async function LoginPage({ searchParams }) {
    const params = await searchParams; // Await params in Next.js 15

    return (
        <main className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-6">
            <div className="w-full max-w-md bg-[var(--card-bg)] p-8 rounded-3xl border border-[var(--border)] shadow-2xl backdrop-blur-xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-[var(--fg)] mb-2">Admin Access</h1>
                    <p className="text-[var(--muted)] text-sm">Enter the master password to continue.</p>
                </div>

                <form action={login} className="flex flex-col gap-6">
                    <div>
                        <input
                            name="password"
                            type="password"
                            placeholder="Master Password"
                            className="w-full h-12 px-4 rounded-xl bg-black/20 border border-[var(--border)] text-[var(--fg)] focus:border-[var(--accent)] outline-none transition-all"
                            required
                        />
                    </div>

                    {params?.error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm text-center font-medium">
                            {params.error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="h-12 bg-[var(--accent)] hover:brightness-110 text-[var(--bg)] font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(var(--accent-rgb),0.3)] hover:shadow-[0_0_30px_rgba(var(--accent-rgb),0.5)]"
                    >
                        Unlock Dashboard
                    </button>

                    <a href="/" className="text-center text-xs text-[var(--muted)] hover:text-[var(--fg)] transition">
                        ← Return to Library
                    </a>
                </form>
            </div>
        </main>
    );
} 
