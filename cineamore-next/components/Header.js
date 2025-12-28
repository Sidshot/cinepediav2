'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import ThemeToggle from './ThemeToggle';
import ContentModeToggle from './ContentModeToggle';

export default function Header({ userMenu, navLinks }) {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header
            className={`sticky top-0 z-40 backdrop-blur-[20px] bg-[rgba(11,15,20,0.4)] border-b border-[var(--border)] mask-image-[linear-gradient(to_bottom,black_85%,transparent_100%)] transition-all duration-500 ease-in-out ${scrolled ? 'opacity-0 -translate-y-full pointer-events-none' : 'opacity-100 translate-y-0'}`}
        >
            <div className="max-w-[1600px] mx-auto px-3 sm:px-5 py-3 sm:py-4">
                <div className="flex items-center justify-between gap-2 sm:gap-5">

                    {/* Brand + Mode Toggle */}
                    <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-shrink">
                        <Link
                            href="/"
                            className="flex items-center gap-1.5 sm:gap-2.5 no-underline group flex-shrink-0"
                            onClick={() => {
                                // Reset to Films mode when clicking logo
                                if (typeof window !== 'undefined') {
                                    localStorage.setItem('contentMode', 'films');
                                }
                            }}
                        >
                            <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent2)] shadow-[0_0_20px_rgba(255,176,63,0.5)] group-hover:scale-110 transition-transform"></div>
                            <h1
                                className="text-base sm:text-[1.45rem] font-extrabold tracking-wide m-0 bg-clip-text text-transparent bg-gradient-to-r from-[var(--fg)] to-[var(--accent)] whitespace-nowrap"
                            >
                                <span className="hidden xs:inline">CineAmore</span>
                                <span className="xs:hidden">CA</span>
                                <span className="hidden sm:inline text-xl"> 🎞️</span>
                            </h1>
                        </Link>

                        {/* Films/Series Toggle */}
                        <ContentModeToggle />
                    </div>

                    {/* Center Navigation */}
                    {navLinks}

                    {/* Right Controls */}
                    <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                        <ThemeToggle />
                        {userMenu}
                    </div>
                </div>
            </div>
        </header>
    );
}

