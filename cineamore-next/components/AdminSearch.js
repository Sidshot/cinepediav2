'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function AdminSearch({ placeholder = "Search..." }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [text, setText] = useState(searchParams.get('q') || '');
    const [query] = useDebounce(text, 500); // 500ms debounce

    // Sync input with URL if URL changes externally
    useEffect(() => {
        setText(searchParams.get('q') || '');
    }, [searchParams]);

    // Push URL on debounce query change
    useEffect(() => {
        const current = searchParams.get('q') || '';
        if (query !== current) {
            const params = new URLSearchParams(searchParams);
            if (query) {
                params.set('q', query);
            } else {
                params.delete('q');
            }
            router.push(`?${params.toString()}`);
        }
    }, [query, router, searchParams]);

    return (
        <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[var(--muted)]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
            <input
                type="text"
                className="block w-full p-4 pl-10 text-sm text-[var(--fg)] bg-[rgba(255,255,255,0.03)] border border-[var(--border)] rounded-[14px] focus:ring-[var(--accent)] focus:border-[var(--accent)] placeholder-[var(--muted)] backdrop-blur transition-all"
                placeholder={placeholder}
                value={text}
                onChange={(e) => setText(e.target.value)}
            />
        </div>
    );
}

// Simple manual useDebounce hook implementation to avoid new dependencies if possible
// But standard `use-debounce` is common. If not installed, I'll inline the hook.
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return [debouncedValue];
}
