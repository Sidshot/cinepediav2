'use client';

import { useState } from 'react';
import Link from 'next/link';

const features = [
    {
        id: 'series-mode',
        icon: '📺',
        title: 'Series Mode',
        tagline: 'Stream your favorite TV shows',
        description: 'Browse and stream thousands of TV series directly from CineAmore. Access trending shows, popular series, and explore by genre.',
        howToUse: [
            'Click the toggle switch in the header to switch between Films and Series mode',
            'Browse trending, popular, and top-rated series on the main Series page',
            'Click on any series to view details, seasons, and episodes',
            'Click any episode to start streaming instantly'
        ],
        isNew: true
    },
    {
        id: 'sticky-search',
        icon: '🔍',
        title: 'Global Search Bar',
        tagline: 'Search anytime, anywhere',
        description: 'A minimalist search bar that appears when you scroll down on any page. Search for movies or series without losing your place.',
        howToUse: [
            'Scroll down on any page to reveal the floating search bar',
            'Start typing to see instant results',
            'Click a result to go directly to that movie or series',
            'The search automatically adapts to Films or Series mode'
        ],
        isNew: true
    },
    {
        id: 'genre-rows',
        icon: '🎬',
        title: 'Genre Discovery',
        tagline: 'Explore content by category',
        description: 'Browse curated rows of content organized by genre. Each row features horizontal scrolling with View All options for deeper exploration.',
        howToUse: [
            'Hover over any genre row to reveal scroll arrows',
            'Click "View All" to see the complete collection for that genre',
            'Works on both Films and Series pages'
        ],
        isNew: true
    },
    {
        id: 'streaming',
        icon: '▶️',
        title: 'Instant Streaming',
        tagline: 'Watch without downloads',
        description: 'Stream movies and TV episodes directly in your browser. No downloads required for TMDB content and all series.',
        howToUse: [
            'Browse to any movie or series detail page',
            'Click the "Stream" button to start watching',
            'Use the player controls for fullscreen, theater mode, and more',
            'Your progress is saved automatically'
        ],
        isNew: false
    }
];

const faqs = [
    {
        question: 'How do I switch between Films and Series?',
        answer: 'Look for the toggle switch in the header (top-right area). Click it to switch between Films mode (yellow theme) and Series mode (orange theme). Clicking the CineAmore logo always returns you to Films mode.'
    },
    {
        question: 'Where is the search bar?',
        answer: 'The global search bar appears when you scroll down on any page. It floats at the top center of your screen. You can also find a dedicated search bar on the main Films and Series pages.'
    },
    {
        question: 'Why can\'t I download some movies?',
        answer: 'CineAmore has two types of content: Catalogue films (with download links) and TMDB films (streaming only). Catalogue films show a green "Download" badge, while TMDB films show a purple "Stream" badge. Series are streaming-only.'
    },
    {
        question: 'The stream isn\'t working. What should I do?',
        answer: 'Try refreshing the page. If the issue persists, use the "Report" button on the movie/series page to let us know. Some content may have regional restrictions.'
    },
    {
        question: 'How do I request a movie or series?',
        answer: 'Use the "Request" button available on the navigation or contact us through the provided channels. We review requests regularly and add content when available.'
    },
    {
        question: 'Is CineAmore free?',
        answer: 'Yes! CineAmore is completely free to use. We provide access to movies and TV series for personal entertainment purposes.'
    }
];

export default function WhatsNewPage() {
    const [expandedFaq, setExpandedFaq] = useState(null);
    const [expandedFeature, setExpandedFeature] = useState(null);

    return (
        <main className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
            {/* Hero Section */}
            <section className="relative pt-24 pb-16 px-4 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/10 via-transparent to-transparent" />
                <div className="absolute top-20 left-1/4 w-64 h-64 bg-yellow-500/20 rounded-full blur-[100px]" />
                <div className="absolute top-40 right-1/4 w-48 h-48 bg-orange-500/20 rounded-full blur-[80px]" />

                <div className="relative max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/30 rounded-full px-4 py-2 mb-6">
                        <span className="text-yellow-400 text-sm font-medium">🎄 December 2024 Update</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black mb-4 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                        What's New in CineAmore
                    </h1>
                    <p className="text-lg text-[var(--muted)] max-w-2xl mx-auto">
                        Discover the latest features and improvements we've made to enhance your streaming experience.
                    </p>
                </div>
            </section>

            {/* Features Grid */}
            <section className="px-4 pb-16">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                        <span className="w-1.5 h-8 bg-gradient-to-b from-yellow-500 to-orange-500 rounded-full" />
                        New Features
                    </h2>

                    <div className="grid gap-6 md:grid-cols-2">
                        {features.map((feature) => (
                            <div
                                key={feature.id}
                                className="group relative bg-[var(--card-bg)] border border-white/10 rounded-2xl p-6 hover:border-yellow-500/30 transition-all duration-300"
                            >
                                {feature.isNew && (
                                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
                                        NEW
                                    </div>
                                )}

                                <div className="flex items-start gap-4 mb-4">
                                    <span className="text-4xl">{feature.icon}</span>
                                    <div>
                                        <h3 className="text-xl font-bold text-white group-hover:text-yellow-400 transition-colors">
                                            {feature.title}
                                        </h3>
                                        <p className="text-sm text-yellow-400/80">{feature.tagline}</p>
                                    </div>
                                </div>

                                <p className="text-[var(--muted)] text-sm mb-4">
                                    {feature.description}
                                </p>

                                <button
                                    onClick={() => setExpandedFeature(expandedFeature === feature.id ? null : feature.id)}
                                    className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors flex items-center gap-1"
                                >
                                    {expandedFeature === feature.id ? 'Hide' : 'How to use'}
                                    <span className={`transition-transform ${expandedFeature === feature.id ? 'rotate-180' : ''}`}>↓</span>
                                </button>

                                {expandedFeature === feature.id && (
                                    <div className="mt-4 pt-4 border-t border-white/10">
                                        <ul className="space-y-2">
                                            {feature.howToUse.map((step, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-sm text-[var(--muted)]">
                                                    <span className="text-yellow-500 font-bold">{idx + 1}.</span>
                                                    {step}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="px-4 pb-20">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                        <span className="w-1.5 h-8 bg-gradient-to-b from-orange-500 to-red-500 rounded-full" />
                        Frequently Asked Questions
                    </h2>

                    <div className="space-y-3">
                        {faqs.map((faq, idx) => (
                            <div
                                key={idx}
                                className="bg-[var(--card-bg)] border border-white/10 rounded-xl overflow-hidden"
                            >
                                <button
                                    onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                                    className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                                >
                                    <span className="font-medium text-white">{faq.question}</span>
                                    <span className={`text-yellow-400 transition-transform ${expandedFaq === idx ? 'rotate-180' : ''}`}>
                                        ↓
                                    </span>
                                </button>

                                {expandedFaq === idx && (
                                    <div className="px-5 pb-4 text-[var(--muted)] text-sm border-t border-white/5 pt-3">
                                        {faq.answer}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="px-4 pb-20">
                <div className="max-w-3xl mx-auto text-center bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10 border border-white/10 rounded-3xl p-8">
                    <h3 className="text-2xl font-bold mb-3">Ready to Explore?</h3>
                    <p className="text-[var(--muted)] mb-6">Try out the new features and let us know what you think!</p>
                    <div className="flex flex-wrap justify-center gap-3">
                        <Link
                            href="/"
                            className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold rounded-full hover:shadow-lg hover:shadow-yellow-500/30 transition-all"
                        >
                            Browse Films
                        </Link>
                        <Link
                            href="/series"
                            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-full hover:shadow-lg hover:shadow-orange-500/30 transition-all"
                        >
                            Explore Series
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer note */}
            <div className="text-center pb-10 text-sm text-[var(--muted)]">
                Last updated: December 24, 2024 • Made with ❤️ by CineAmore
            </div>
        </main>
    );
}


