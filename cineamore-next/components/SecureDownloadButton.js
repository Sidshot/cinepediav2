'use client';

import { useState } from 'react';

export default function SecureDownloadButton({
    movieId,
    linkIndex = 0,
    label = 'Download',
    variant = 'detail' // 'detail' | 'grid'
}) {
    const [isLoading, setIsLoading] = useState(false);

    const handleSecureDownload = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isLoading) return;

        setIsLoading(true);
        try {
            const res = await fetch('/api/download/sign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ movieId, linkIndex })
            });

            if (!res.ok) {
                const text = await res.text();
                let message = text;
                try {
                    const json = JSON.parse(text);
                    if (json.message) message = json.message;
                } catch (e) { /* ignore JSON parse error */ }

                alert(`Download blocked: ${message}`);
                setIsLoading(false);
                return;
            }

            const data = await res.json();
            window.location.href = data.url; // Trigger redirect

            setTimeout(() => setIsLoading(false), 2000); // Reset state

        } catch (error) {
            console.error('Download error:', error);
            setIsLoading(false);
            alert('An error occurred. Please try again.');
        }
    };

    if (variant === 'grid') {
        // Logic mainly handled inline in grid for layout reasons, but could be unified.
        // For now this component is primarily for the detail page or generic usage.
        return null;
    }

    // Default Style (Detail Page)
    return (
        <button
            onClick={handleSecureDownload}
            disabled={isLoading}
            className={`
                bg-white/5 hover:bg-[var(--accent)] hover:text-black 
                border border-white/10 px-6 py-3 rounded-xl font-bold 
                transition-all flex items-center gap-2 group
                ${isLoading ? 'opacity-70 cursor-wait' : ''}
            `}
        >
            {label}
            {isLoading ? (
                <svg className="w-4 h-4 animate-spin fill-current" viewBox="0 0 24 24"><path d="M12 4V2C6.48 2 2 6.48 2 12h2c0-5.52 4.48-10 10-10zm0 16c5.52 0 10-4.48 10-10h-2c0 4.42-3.58 8-8 8v2z" /></svg>
            ) : (
                <svg className="w-4 h-4 opacity-50 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            )}
        </button>
    );
}
