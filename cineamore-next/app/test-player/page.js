'use client';

import { useState } from 'react';
import StreamingPlayer from '@/components/StreamingPlayer';

export default function TestPlayerPage() {
    const [tmdbId, setTmdbId] = useState('293660'); // Deadpool default
    const [key, setKey] = useState(0);

    const handleLoad = () => {
        setKey(prev => prev + 1);
    };

    return (
        <div className="min-h-screen bg-black text-white pt-20">
            <div className="w-full px-4 space-y-8">
                <div>
                    <h1 className="text-3xl font-bold mb-4">Test Player</h1>
                    <p className="text-gray-400">
                        Testing the new Multi-Provider StreamingPlayer.
                    </p>
                </div>

                <div className="flex gap-4 items-end bg-gray-900 p-6 rounded-xl border border-gray-800">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            TMDB ID
                        </label>
                        <input
                            type="text"
                            value={tmdbId}
                            onChange={(e) => setTmdbId(e.target.value)}
                            className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                        />
                    </div>
                    <button
                        onClick={handleLoad}
                        className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg transition-colors"
                    >
                        Load Stream
                    </button>
                </div>

                <div className="border-t border-gray-800 pt-8">
                    <h2 className="text-xl font-semibold mb-6 text-yellow-500">Player Preview</h2>

                    <StreamingPlayer
                        key={key}
                        tmdbId={tmdbId}
                        title="Test Movie"
                    />
                </div>
            </div>
        </div>
    );
}
