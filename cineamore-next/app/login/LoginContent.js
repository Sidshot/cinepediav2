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
    const isGateMode = searchParams.get('gate') === 'true';

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(searchParams.get('error') || '');
    const [loading, setLoading] = useState(false);

    // Site Gate Login — POSTs to /api/auth/site-login
    const handleGateLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/site-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username.trim(), password })
            });

            const data = await res.json();

            if (data.success) {
                // Redirect to home — site_gate cookie is now set (HTTP-only)
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

    // Admin/Contributor Login — POSTs to /api/auth/login (existing)
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

    // SITE GATE MODE — simplified, locked-down login
    if (isGateMode) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-6">
                <div className="w-full max-w-md bg-[#111111] p-8 rounded-3xl border border-white/10 shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="text-4xl mb-4">🔒</div>
                        <h1 className="text-2xl font-extrabold text-white mb-2">CineAmore</h1>
                        <p className="text-gray-500 text-sm">This site is private. Enter credentials to continue.</p>
                    </div>

                    <form onSubmit={handleGateLogin} className="flex flex-col gap-5">
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">
                                Username
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter username"
                                autoComplete="username"
                                required
                                className="w-full h-12 px-4 rounded-xl bg-black/40 border border-white/10 text-white focus:border-yellow-500 outline-none transition-all placeholder:text-gray-600"
                            />
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter password"
                                autoComplete="current-password"
                                required
                                className="w-full h-12 px-4 rounded-xl bg-black/40 border border-white/10 text-white focus:border-yellow-500 outline-none transition-all placeholder:text-gray-600"
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center font-medium">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="h-12 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] disabled:opacity-50"
                        >
                            {loading ? 'Verifying...' : 'Enter Site'}
                        </button>
                    </form>

                    {/* Contact for access */}
                    <div className="mt-6 pt-5 border-t border-white/10 text-center">
                        <p className="text-gray-500 text-xs mb-3">Don&apos;t have access?</p>
                        <a
                            href="mailto:indocurry@proton.me?subject=CineAmore%20Access%20Request&body=Hi%2C%20I%20would%20like%20to%20request%20access%20to%20CineAmore.%0A%0AMy%20name%3A%20%0AReason%3A%20"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm text-gray-300 hover:text-white transition-all"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Request Access
                        </a>
                    </div>
                </div>
            </main>
        );
    }

    // NORMAL MODE — Admin / Contributor Login (unchanged logic)
    return (
        <main className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-6">
            <div className="w-full max-w-md bg-[var(--card-bg)] p-8 rounded-3xl border border-[var(--border)] shadow-2xl backdrop-blur-xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-[var(--fg)] mb-2">Access Portal</h1>
                    <p className="text-[var(--muted)] text-sm">Admin or Contributor login</p>
                </div>

                <form onSubmit={handleAdminLogin} className="flex flex-col gap-6">
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
