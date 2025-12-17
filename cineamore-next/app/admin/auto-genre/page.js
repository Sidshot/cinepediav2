'use client';

import { useState, useEffect } from 'react';

export default function AutoGenrePage() {
    const [status, setStatus] = useState('idle'); // idle, running, paused, complete
    const [progress, setProgress] = useState({ processed: 0, total: 0, remaining: 0 });
    const [logs, setLogs] = useState([]);

    // Auto-scroll logs
    useEffect(() => {
        const logContainer = document.getElementById('log-container');
        if (logContainer) logContainer.scrollTop = logContainer.scrollHeight;
    }, [logs]);

    const startProcessing = async () => {
        setStatus('running');
        let isRunning = true;

        while (isRunning) {
            try {
                // Add 30s timeout to avoid "stuck" UI
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000);

                const res = await fetch('/api/admin/backfill-genres', { signal: controller.signal });
                clearTimeout(timeoutId);

                const data = await res.json();

                if (data.error) {
                    setLogs(prev => [...prev, `❌ Error: ${data.error}`]);
                    setStatus('error');
                    break;
                }

                // Update Progress
                setProgress({
                    processed: (progress.processed || 0) + data.processed,
                    remaining: data.remaining,
                    total: (progress.processed || 0) + data.processed + data.remaining
                });

                // Add Logs
                const newLogs = data.results.map(r =>
                    r.status === 'Updated'
                        ? `✅ ${r.title}: ${r.genre.join(', ')}`
                        : `⚠️ ${r.title}: ${r.status}`
                );
                setLogs(prev => [...prev, ...newLogs]);

                // Check termination
                if (data.remaining === 0) {
                    setStatus('complete');
                    isRunning = false;
                } else if (status === 'paused') {
                    // This won't work inside loop immediately, but good for next iteration logic if we refactor
                    // For now, simple loop
                }

                // Small delay to be safe
                await new Promise(r => setTimeout(r, 1000));

            } catch (e) {
                console.error(e);
                setLogs(prev => [...prev, `❌ Network Error: ${e.message}`]);
                setStatus('error');
                isRunning = false;
            }
        }
    };

    return (
        <main className="min-h-screen bg-[var(--bg)] p-8 text-[var(--fg)]">
            <div className="max-w-4xl mx-auto space-y-8">
                <header className="flex items-center justify-between border-b border-[var(--border)] pb-6">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                            🪄 Auto-Genre Manager
                        </h1>
                        <p className="text-[var(--muted)]">Automatically finding genres for {progress.remaining || '...'} movies.</p>
                    </div>
                    <a href="/admin" className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition">
                        Back to Admin
                    </a>
                </header>

                <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-8 shadow-2xl">

                    {/* Progress Bar */}
                    <div className="mb-8 space-y-2">
                        <div className="flex justify-between text-sm font-bold">
                            <span>Progress</span>
                            <span>{progress.remaining} Remaining</span>
                        </div>
                        <div className="h-4 bg-black/40 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                                style={{ width: `${progress.total ? (1 - progress.remaining / progress.total) * 100 : 0}%` }}
                            />
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex gap-4">
                        {status === 'idle' && (
                            <button
                                onClick={startProcessing}
                                className="px-8 py-4 bg-[var(--accent)] text-[var(--bg)] font-bold rounded-xl shadow-[0_0_20px_rgba(var(--accent-rgb),0.4)] hover:scale-105 transition"
                            >
                                Start Magic ✨
                            </button>
                        )}
                        {status === 'running' && (
                            <div className="px-8 py-4 bg-white/5 text-[var(--accent)] font-bold rounded-xl animate-pulse cursor-wait">
                                Processing... (Do not close tab)
                            </div>
                        )}
                        {status === 'complete' && (
                            <div className="px-8 py-4 bg-green-500/20 text-green-400 font-bold rounded-xl">
                                ✅ All Done!
                            </div>
                        )}
                    </div>
                </div>

                {/* Logs Console */}
                <div className="bg-black/80 rounded-2xl border border-[var(--border)] p-4 font-mono text-xs h-96 overflow-y-auto custom-scrollbar" id="log-container">
                    {logs.length === 0 ? (
                        <div className="text-[var(--muted)] text-center mt-32">Ready to start...</div>
                    ) : (
                        logs.map((log, i) => (
                            <div key={i} className={`mb-1 ${log.startsWith('✅') ? 'text-green-400' : log.startsWith('❌') ? 'text-red-400' : 'text-yellow-400'}`}>
                                {log}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </main>
    );
}
