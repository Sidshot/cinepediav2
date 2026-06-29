'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import KoFiButton from '@/components/KoFiButton';

const RENDER_FALLBACK_URL = 'http://cineamore-ikz7.onrender.com/';

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
    const isGateMode = searchParams.get('gate') === 'true';

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(searchParams.get('error') || '');
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);

    const handleGateLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/site-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: username.trim(),
                    password,
                    rememberMe
                })
            });

            const data = await res.json();

            if (data.success) {
                window.location.href = '/';
            } else {
                setError(data.error || 'Invalid credentials');
            }
        } catch (err) {
            setError('Connection error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleAdminLogin = async (e) => {
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

    if (isGateMode) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-6 relative overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] h-80 w-80 rounded-full bg-[var(--accent)]/15 blur-[90px] pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] h-80 w-80 rounded-full bg-[var(--accent2)]/15 blur-[90px] pointer-events-none" />

                <div className="relative z-10 w-full max-w-md rounded-[28px] border border-[var(--border)] bg-[var(--card-bg)]/95 p-6 shadow-2xl backdrop-blur-xl sm:p-7">
                    <div className="mb-6 text-center">
                        <div className="mb-3 text-3xl text-[var(--accent)]">LOCKED</div>
                        <h1 className="text-2xl font-extrabold text-[var(--fg)]">CineAmore is private</h1>
                        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                            Hard to maintain and cover server costs out of pocket. If you can, please donate.
                        </p>
                    </div>

                    <form onSubmit={handleGateLogin} className="flex flex-col gap-4">
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Username"
                            autoComplete="username"
                            required
                            className="h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 text-[var(--fg)] outline-none transition-all placeholder-[var(--muted)] focus:border-[var(--accent)]"
                        />

                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            autoComplete="current-password"
                            required
                            className="h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 text-[var(--fg)] outline-none transition-all placeholder-[var(--muted)] focus:border-[var(--accent)]"
                        />

                        <div className="flex justify-center pt-1">
                            <KoFiButton />
                        </div>

                        <label className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-white/5 px-4 py-3 text-sm text-[var(--fg)]">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="h-4 w-4 rounded border-[var(--border)] bg-transparent accent-[var(--accent)]"
                            />
                            <span>
                                Remember me for 30 days
                                <span className="block text-xs text-[var(--muted)]">
                                    Uses this device only.
                                </span>
                            </span>
                        </label>

                        {error && (
                            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center text-sm font-medium text-red-400">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-1 h-12 rounded-xl bg-[var(--accent)] font-bold text-black transition-all shadow-[0_0_20px_rgba(255,192,67,0.3)] hover:brightness-110 hover:shadow-[0_0_30px_rgba(255,192,67,0.5)] disabled:opacity-50"
                        >
                            {loading ? 'Verifying...' : 'Unlock'}
                        </button>
                    </form>

                    <div className="mt-5 rounded-2xl border border-[#72a4f240] bg-[#72a4f214] p-4 text-center">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a9c8ff]">
                            Backup Link
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-[var(--fg)]">
                            Bookmark the Render fallback. If this site goes down, check there for the new link.
                        </p>
                        <a
                            href={RENDER_FALLBACK_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#72a4f255] bg-[#72a4f226] px-4 py-3 text-sm font-bold text-[#d9e7ff] transition-all hover:bg-[#72a4f236] hover:text-white"
                        >
                            cineamore-ikz7.onrender.com
                        </a>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-6">
            <div className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--card-bg)] p-8 shadow-2xl backdrop-blur-xl">
                <div className="mb-8 text-center">
                    <h1 className="mb-2 text-3xl font-extrabold text-[var(--fg)]">Access Portal</h1>
                    <p className="text-sm text-[var(--muted)]">Admin or Contributor login</p>
                </div>

                <form onSubmit={handleAdminLogin} className="flex flex-col gap-6">
                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
                            Username
                            <span className="ml-2 text-[10px] font-normal normal-case opacity-70">(leave blank for Admin)</span>
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Contributor username..."
                            autoComplete="username"
                            className="h-12 w-full rounded-xl border border-[var(--border)] bg-black/20 px-4 text-[var(--fg)] outline-none transition-all focus:border-[var(--accent)]"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            autoComplete="current-password"
                            required
                            className="h-12 w-full rounded-xl border border-[var(--border)] bg-black/20 px-4 text-[var(--fg)] outline-none transition-all focus:border-[var(--accent)]"
                        />
                    </div>

                    {error && (
                        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center text-sm font-medium text-red-500">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="h-12 rounded-xl bg-[var(--accent)] font-bold text-[var(--bg)] transition-all shadow-[0_0_20px_rgba(var(--accent-rgb),0.3)] hover:brightness-110 hover:shadow-[0_0_30px_rgba(var(--accent-rgb),0.5)] disabled:opacity-50"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>

                    <div className="space-y-1 text-center text-[10px] text-[var(--muted)]">
                        <p><strong>Admin:</strong> Leave username blank, enter admin password</p>
                        <p><strong>Contributor:</strong> Enter your username and password</p>
                    </div>

                    <Link href="/" className="text-center text-xs text-[var(--muted)] transition hover:text-[var(--fg)]">
                        Return to Library
                    </Link>
                </form>
            </div>
        </main>
    );
}
