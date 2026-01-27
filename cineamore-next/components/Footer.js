'use client';

import { useState, useEffect } from 'react';

export default function Footer() {
    const [activeTab, setActiveTab] = useState(null); // 'dmca', 'contact', or null
    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 300);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <footer className="mt-auto relative">

            {/* Prominent Back to Top Button - Floats above footer */}
            <div className={`absolute -top-12 left-0 right-0 flex justify-center pointer-events-none`}>
                <button
                    onClick={scrollToTop}
                    className={`
                        pointer-events-auto
                        flex items-center gap-2 px-8 py-3 rounded-full 
                        bg-[var(--accent)] text-black font-extrabold text-sm tracking-wide shadow-xl shadow-[var(--accent)]/30
                        border border-[#ffffff40] backdrop-blur-md
                        hover:scale-110 hover:shadow-[var(--accent)]/50 hover:bg-white transition-all duration-300
                        ${showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                    `}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    BACK TO TOP
                </button>
            </div>

            <div className="border-t border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-md">
                <div className="container mx-auto px-6 max-w-5xl py-8">

                    {/* Main Row: Logo (Left) | Links (Right) */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">

                        {/* Brand & Copy */}
                        <div className="text-center md:text-left">
                            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                                <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--fg)] to-[var(--muted)]">
                                    CineAmore
                                </span>
                            </div>
                            <p className="text-xs text-[var(--muted)]">
                                &copy; {new Date().getFullYear()} All rights reserved.
                            </p>
                        </div>

                        {/* Minimal Navigation */}
                        <div className="flex items-center gap-8 text-sm font-bold tracking-wide">
                            <a
                                href="https://buymeacoffee.com/cineamore"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#FF4500] hover:text-[#FF6347] transition-all hover:scale-105 flex items-center gap-1"
                            >
                                <span>☕</span>
                                <span>Support CineAmore</span>
                            </a>
                            <button
                                onClick={() => setActiveTab(activeTab === 'dmca' ? null : 'dmca')}
                                className={`transition-all hover:scale-105 ${activeTab === 'dmca' ? 'text-[var(--accent)]' : 'text-[var(--muted)] hover:text-[var(--fg)]'}`}
                            >
                                DMCA
                            </button>
                            <button
                                onClick={() => setActiveTab(activeTab === 'contact' ? null : 'contact')}
                                className={`transition-all hover:scale-105 ${activeTab === 'contact' ? 'text-[var(--accent)]' : 'text-[var(--muted)] hover:text-[var(--fg)]'}`}
                            >
                                Contact
                            </button>
                        </div>
                    </div>

                    {/* Collapsible Content Area */}
                    <div className={`overflow-hidden transition-all duration-500 ease-in-out ${activeTab ? 'max-h-[300px] opacity-100 mt-8' : 'max-h-0 opacity-0 mt-0'}`}>
                        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6 text-center md:text-left max-w-2xl mx-auto shadow-xl">

                            {activeTab === 'dmca' && (
                                <div className="animate-fade-in">
                                    <h3 className="text-sm font-bold text-[var(--fg)] mb-2 flex items-center justify-center md:justify-start gap-2">
                                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                        Content Disclaimer
                                    </h3>
                                    <p className="text-xs text-[var(--muted)] leading-relaxed">
                                        This site only aggregates films found on the public internet.
                                        <span className="text-[var(--fg)]"> Nothing is hosted on the site itself. </span>
                                        Everything belongs to their respective third-party owners.
                                        For takedown requests, please contact us.
                                    </p>
                                </div>
                            )}

                            {activeTab === 'contact' && (
                                <div className="animate-fade-in">
                                    <h3 className="text-sm font-bold text-[var(--fg)] mb-2 flex items-center justify-center md:justify-start gap-2">
                                        <svg className="w-4 h-4 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                        Contact Us
                                    </h3>
                                    <p className="text-xs text-[var(--muted)] mb-3">
                                        For takedowns, inquiries, or feedback.
                                    </p>
                                    <a
                                        href="mailto:indocurry@proton.me"
                                        className="inline-flex items-center gap-2 text-sm font-bold text-[var(--accent)] hover:underline"
                                    >
                                        indocurry@proton.me
                                    </a>
                                </div>
                            )}

                        </div>
                    </div>

                </div>
            </div>
        </footer>
    );
}
