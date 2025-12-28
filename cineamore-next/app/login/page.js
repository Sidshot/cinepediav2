'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[var(--bg)]" />}>
            <LoginContent />
        </Suspense>
    );
}

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(searchParams.get('error') || '');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username.trim(), password })
            });

            const data = await res.json();

            if (data.success) {
                router.push(data.redirect || '/contributor');
                router.refresh();
            } else {
                setError(data.error || 'Invalid Credentials');
            }
        } catch (err) {
            setError('Connection error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-6">
            <div className="w-full max-w-md bg-[var(--card-bg)] p-8 rounded-3xl border border-[var(--border)] shadow-2xl backdrop-blur-xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-[var(--fg)] mb-2">Access Portal</h1>
                    <p className="text-[var(--muted)] text-sm">Admin or Contributor login</p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    {/* Username */}
                    <div>
                        <label className="block text-xs uppercase tracking-widest text-[var(--muted)] font-bold mb-2">
                            Username
                            <span className="text-[10px] normal-case font-normal ml-2 opacity-70">(leave blank for Admin)</span>
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Contributor username..."
                            autoComplete="username"
                            className="w-full h-12 px-4 rounded-xl bg-black/20 border border-[var(--border)] text-[var(--fg)] focus:border-[var(--accent)] outline-none transition-all"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-xs uppercase tracking-widest text-[var(--muted)] font-bold mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            autoComplete="current-password"
                            required
                            className="w-full h-12 px-4 rounded-xl bg-black/20 border border-[var(--border)] text-[var(--fg)] focus:border-[var(--accent)] outline-none transition-all"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm text-center font-medium">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="h-12 bg-[var(--accent)] hover:brightness-110 text-[var(--bg)] font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(var(--accent-rgb),0.3)] hover:shadow-[0_0_30px_rgba(var(--accent-rgb),0.5)] disabled:opacity-50"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>

                    {/* Help Text */}
                    <div className="text-center text-[10px] text-[var(--muted)] space-y-1">
                        <p><strong>Admin:</strong> Leave username blank, enter admin password</p>
                        <p><strong>Contributor:</strong> Enter your username and password</p>
                    </div>

                    <a href="/" className="text-center text-xs text-[var(--muted)] hover:text-[var(--fg)] transition">
                        ← Return to Library
                    </a>
                </form>
            </div>
        </main>
    );
}
