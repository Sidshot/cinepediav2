'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { parseFileContent, validateImportData, enrichWithTMDB, bulkImportMovies, checkDuplicates } from '@/lib/bulkImport';

export default function BulkImportPage() {
    const [file, setFile] = useState(null);
    const [parsedMovies, setParsedMovies] = useState([]);
    const [validation, setValidation] = useState(null);
    const [enrichedMovies, setEnrichedMovies] = useState([]);
    const [step, setStep] = useState('upload'); // upload, preview, enriching, ready, importing, done
    const [progress, setProgress] = useState(0);
    const [importResult, setImportResult] = useState(null);
    const [error, setError] = useState(null);
    const [detectedFormat, setDetectedFormat] = useState(null);
    const [currentMovie, setCurrentMovie] = useState('');
    const [totalToProcess, setTotalToProcess] = useState(0);

    // Handle file drop
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer?.files?.[0] || e.target.files?.[0];

        if (droppedFile) {
            const ext = droppedFile.name.split('.').pop()?.toLowerCase();
            const validExts = ['json', 'csv', 'txt'];

            if (validExts.includes(ext) || droppedFile.type.includes('text') || droppedFile.type.includes('json')) {
                setFile(droppedFile);
                handleFileRead(droppedFile);
            } else {
                setError('Please upload a JSON, CSV, or TXT file');
            }
        }
    }, []);

    // Read and validate file
    const handleFileRead = async (file) => {
        try {
            const text = await file.text();

            // Parse using multi-format parser
            const movies = await parseFileContent(text, file.name);

            if (!movies || movies.length === 0) {
                setError('No valid movies found in file');
                return;
            }

            setParsedMovies(movies);
            setDetectedFormat(file.name.split('.').pop()?.toUpperCase() || 'TXT');

            // Validate parsed movies
            const result = await validateImportData({ movies });
            if (result.error) {
                setError(result.error);
                return;
            }

            setValidation(result);
            setStep('preview');
            setError(null);
        } catch (e) {
            setError(`Failed to read file: ${e.message}`);
        }
    };

    // Fetch TMDB data for movies that need it (one-by-one for progress)
    const handleEnrich = async () => {
        setStep('enriching');
        setProgress(0);

        try {
            // Get valid movies
            const validMovies = validation.entries
                .filter(e => e.isValid)
                .map(e => e.original);

            setTotalToProcess(validMovies.length);
            const enriched = [];

            // Process one-by-one for live progress
            for (let i = 0; i < validMovies.length; i++) {
                const movie = validMovies[i];
                setCurrentMovie(movie.title);
                setProgress(i + 1);

                // Enrich with TMDB if needed
                if (!movie.year || !movie.director || !movie.genre?.length) {
                    const enrichedMovie = await enrichWithTMDB(movie);
                    enriched.push(enrichedMovie);
                } else {
                    enriched.push({ ...movie, tmdbStatus: 'skipped' });
                }
            }

            // Check for duplicates
            setCurrentMovie('Checking duplicates...');
            const withDuplicates = await checkDuplicates(enriched);

            setEnrichedMovies(withDuplicates);
            setCurrentMovie('');
            setStep('ready');
        } catch (e) {
            setError(`Enrichment failed: ${e.message}`);
            setStep('preview');
        }
    };

    // Import movies
    const handleImport = async () => {
        setStep('importing');
        setProgress(0);

        try {
            // Filter out duplicates and invalid entries
            const moviesToImport = enrichedMovies.filter(m => !m.isDuplicate);

            const result = await bulkImportMovies(moviesToImport);
            setImportResult(result);
            setStep('done');
        } catch (e) {
            setError(`Import failed: ${e.message}`);
            setStep('ready');
        }
    };

    // Reset
    const handleReset = () => {
        setFile(null);
        setParsedMovies([]);
        setValidation(null);
        setEnrichedMovies([]);
        setStep('upload');
        setProgress(0);
        setImportResult(null);
        setError(null);
        setDetectedFormat(null);
    };

    return (
        <main className="min-h-screen p-8 max-w-7xl mx-auto bg-[var(--bg)]">
            {/* Header */}
            <div className="mb-8">
                <Link href="/admin" className="text-[var(--muted)] hover:text-[var(--fg)] text-sm mb-4 inline-block transition">
                    ← Back to Dashboard
                </Link>
                <h1 className="text-3xl font-extrabold text-[var(--fg)]">Bulk Import</h1>
                <p className="text-[var(--muted)]">Import multiple films from JSON, CSV, or TXT files</p>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                    {error}
                    <button onClick={() => setError(null)} className="ml-4 text-sm underline">Dismiss</button>
                </div>
            )}

            {/* Step 1: Upload */}
            {step === 'upload' && (
                <div
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="border-2 border-dashed border-[var(--border)] rounded-3xl p-16 text-center hover:border-[var(--accent)] transition-colors cursor-pointer"
                    onClick={() => document.getElementById('file-input').click()}
                >
                    <input
                        id="file-input"
                        type="file"
                        accept=".json,.csv,.txt,text/plain,text/csv,application/json"
                        onChange={handleDrop}
                        className="hidden"
                    />
                    <div className="text-6xl mb-4">📁</div>
                    <h2 className="text-xl font-bold text-[var(--fg)] mb-2">Drop file here</h2>
                    <p className="text-[var(--muted)]">Supports JSON, CSV, or TXT (one movie per line)</p>

                    {/* Sample Formats */}
                    <div className="mt-8 grid md:grid-cols-3 gap-4 text-left max-w-4xl mx-auto">
                        <div>
                            <p className="text-sm text-[var(--muted)] mb-2 font-semibold">📄 JSON</p>
                            <pre className="bg-black/30 p-3 rounded-xl text-xs text-green-400 overflow-x-auto">
                                {`{"movies": [
  {"title": "Film",
   "downloadLinks": [
     {"url": "..."}
   ]}
]}`}
                            </pre>
                        </div>
                        <div>
                            <p className="text-sm text-[var(--muted)] mb-2 font-semibold">📊 CSV</p>
                            <pre className="bg-black/30 p-3 rounded-xl text-xs text-blue-400 overflow-x-auto">
                                {`Title,Link
Film 1,http://...
Film 2,http://...`}
                            </pre>
                        </div>
                        <div>
                            <p className="text-sm text-[var(--muted)] mb-2 font-semibold">📝 TXT</p>
                            <pre className="bg-black/30 p-3 rounded-xl text-xs text-purple-400 overflow-x-auto">
                                {`Film 1 | http://...
Film 2 | http://...`}
                            </pre>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 2: Preview */}
            {step === 'preview' && validation && (
                <div className="space-y-6">
                    {/* Summary */}
                    <div className="flex gap-4 flex-wrap">
                        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex-1 min-w-[150px]">
                            <div className="text-3xl font-bold text-green-400">{validation.valid}</div>
                            <div className="text-sm text-[var(--muted)]">Valid</div>
                        </div>
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex-1 min-w-[150px]">
                            <div className="text-3xl font-bold text-yellow-400">{validation.needsTMDB}</div>
                            <div className="text-sm text-[var(--muted)]">Need TMDB Data</div>
                        </div>
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex-1 min-w-[150px]">
                            <div className="text-3xl font-bold text-red-400">{validation.errors}</div>
                            <div className="text-sm text-[var(--muted)]">Errors (skipped)</div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] overflow-hidden">
                        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-white/5 sticky top-0">
                                    <tr>
                                        <th className="text-left p-3 text-[var(--muted)]">#</th>
                                        <th className="text-left p-3 text-[var(--muted)]">Title</th>
                                        <th className="text-left p-3 text-[var(--muted)]">Year</th>
                                        <th className="text-left p-3 text-[var(--muted)]">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {validation.entries.map((entry, i) => (
                                        <tr key={i} className="border-t border-white/5 hover:bg-white/5">
                                            <td className="p-3 text-[var(--muted)]">{i + 1}</td>
                                            <td className="p-3 text-[var(--fg)]">{entry.title}</td>
                                            <td className="p-3 text-[var(--muted)]">{entry.original?.year || '—'}</td>
                                            <td className="p-3">
                                                {entry.isValid ? (
                                                    entry.needsTMDB ? (
                                                        <span className="text-yellow-400">⚠️ Needs TMDB</span>
                                                    ) : (
                                                        <span className="text-green-400">✅ Ready</span>
                                                    )
                                                ) : (
                                                    <span className="text-red-400" title={entry.errors.join(', ')}>❌ {entry.errors[0]}</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 justify-end">
                        <button onClick={handleReset} className="px-6 py-3 rounded-xl border border-[var(--border)] text-[var(--muted)] hover:bg-white/5">
                            Cancel
                        </button>
                        <button
                            onClick={handleEnrich}
                            disabled={validation.valid === 0}
                            className="px-6 py-3 rounded-xl bg-[var(--accent)] text-black font-bold hover:brightness-110 disabled:opacity-50"
                        >
                            Fetch TMDB Data & Continue
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Enriching */}
            {step === 'enriching' && (
                <div className="text-center py-12 max-w-lg mx-auto">
                    <div className="text-6xl mb-4">🔍</div>
                    <h2 className="text-xl font-bold text-[var(--fg)] mb-2">Fetching from TMDB...</h2>

                    {/* Progress Counter */}
                    <p className="text-2xl font-bold text-[var(--accent)] mb-2">
                        {progress} / {totalToProcess}
                    </p>

                    {/* Progress Bar */}
                    <div className="w-full bg-white/10 rounded-full h-3 mb-4 overflow-hidden">
                        <div
                            className="h-full bg-[var(--accent)] rounded-full transition-all duration-300"
                            style={{ width: `${totalToProcess > 0 ? (progress / totalToProcess) * 100 : 0}%` }}
                        />
                    </div>

                    {/* Current Movie */}
                    <p className="text-[var(--muted)] text-sm truncate">
                        {currentMovie ? `Processing: ${currentMovie}` : 'Preparing...'}
                    </p>
                </div>
            )}

            {/* Step 4: Ready */}
            {step === 'ready' && enrichedMovies.length > 0 && (
                <div className="space-y-6">
                    {/* Summary */}
                    <div className="flex gap-4 flex-wrap">
                        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex-1 min-w-[150px]">
                            <div className="text-3xl font-bold text-green-400">
                                {enrichedMovies.filter(m => !m.isDuplicate).length}
                            </div>
                            <div className="text-sm text-[var(--muted)]">Ready to Import</div>
                        </div>
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex-1 min-w-[150px]">
                            <div className="text-3xl font-bold text-blue-400">
                                {enrichedMovies.filter(m => m.tmdbStatus === 'found').length}
                            </div>
                            <div className="text-sm text-[var(--muted)]">TMDB Matched</div>
                        </div>
                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 flex-1 min-w-[150px]">
                            <div className="text-3xl font-bold text-orange-400">
                                {enrichedMovies.filter(m => m.isDuplicate).length}
                            </div>
                            <div className="text-sm text-[var(--muted)]">Duplicates (skip)</div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] overflow-hidden">
                        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-white/5 sticky top-0">
                                    <tr>
                                        <th className="text-left p-3 text-[var(--muted)]">#</th>
                                        <th className="text-left p-3 text-[var(--muted)]">Title</th>
                                        <th className="text-left p-3 text-[var(--muted)]">Year</th>
                                        <th className="text-left p-3 text-[var(--muted)]">Director</th>
                                        <th className="text-left p-3 text-[var(--muted)]">TMDB</th>
                                        <th className="text-left p-3 text-[var(--muted)]">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {enrichedMovies.map((movie, i) => (
                                        <tr key={i} className={`border-t border-white/5 hover:bg-white/5 ${movie.isDuplicate ? 'opacity-50' : ''}`}>
                                            <td className="p-3 text-[var(--muted)]">{i + 1}</td>
                                            <td className="p-3 text-[var(--fg)]">{movie.title}</td>
                                            <td className="p-3 text-[var(--muted)]">{movie.year || '—'}</td>
                                            <td className="p-3 text-[var(--muted)]">{movie.director || '—'}</td>
                                            <td className="p-3">
                                                {movie.tmdbStatus === 'found' && <span className="text-green-400">✓ Found</span>}
                                                {movie.tmdbStatus === 'not_found' && <span className="text-yellow-400">✗ None</span>}
                                                {movie.tmdbStatus === 'skipped' && <span className="text-[var(--muted)]">—</span>}
                                                {movie.tmdbStatus === 'error' && <span className="text-red-400">Error</span>}
                                            </td>
                                            <td className="p-3">
                                                {movie.isDuplicate ? (
                                                    <span className="text-orange-400">Duplicate</span>
                                                ) : (
                                                    <span className="text-green-400">Ready</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 justify-end">
                        <button onClick={handleReset} className="px-6 py-3 rounded-xl border border-[var(--border)] text-[var(--muted)] hover:bg-white/5">
                            Cancel
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={enrichedMovies.filter(m => !m.isDuplicate).length === 0}
                            className="px-6 py-3 rounded-xl bg-green-500 text-white font-bold hover:brightness-110 disabled:opacity-50"
                        >
                            Import {enrichedMovies.filter(m => !m.isDuplicate).length} Movies
                        </button>
                    </div>
                </div>
            )}

            {/* Step 5: Importing */}
            {step === 'importing' && (
                <div className="text-center py-12 max-w-lg mx-auto">
                    <div className="text-6xl mb-4 animate-bounce">📥</div>
                    <h2 className="text-xl font-bold text-[var(--fg)] mb-2">Importing to Database...</h2>
                    <p className="text-2xl font-bold text-green-400">
                        {enrichedMovies.filter(m => !m.isDuplicate).length} movies
                    </p>
                    <p className="text-[var(--muted)] text-sm mt-2">Please wait...</p>
                </div>
            )}

            {/* Step 6: Done */}
            {step === 'done' && importResult && (
                <div className="space-y-6">
                    {/* Summary */}
                    <div className="text-center py-8">
                        <div className="text-6xl mb-4">🎉</div>
                        <h2 className="text-2xl font-bold text-[var(--fg)] mb-2">Import Complete!</h2>
                    </div>

                    <div className="flex gap-4 flex-wrap justify-center">
                        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 min-w-[150px] text-center">
                            <div className="text-3xl font-bold text-green-400">{importResult.imported}</div>
                            <div className="text-sm text-[var(--muted)]">Imported</div>
                        </div>
                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 min-w-[150px] text-center">
                            <div className="text-3xl font-bold text-orange-400">{importResult.skipped}</div>
                            <div className="text-sm text-[var(--muted)]">Skipped</div>
                        </div>
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 min-w-[150px] text-center">
                            <div className="text-3xl font-bold text-red-400">{importResult.errors.length}</div>
                            <div className="text-sm text-[var(--muted)]">Errors</div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 justify-center">
                        <button onClick={handleReset} className="px-6 py-3 rounded-xl border border-[var(--border)] text-[var(--muted)] hover:bg-white/5">
                            Import More
                        </button>
                        <Link href="/admin" className="px-6 py-3 rounded-xl bg-[var(--accent)] text-black font-bold hover:brightness-110">
                            Back to Dashboard
                        </Link>
                    </div>
                </div>
            )}
        </main>
    );
}
