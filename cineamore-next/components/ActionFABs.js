'use client';

import { useState } from 'react';

export default function ActionFABs() {
    const [showReportModal, setShowReportModal] = useState(false);
    const [showPreMessage, setShowPreMessage] = useState(true); // New: controls which step to show
    const [reportName, setReportName] = useState('');
    const [reportMsg, setReportMsg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Request Feature ---
    const handleRequest = async () => {
        const title = prompt("Search for your film? 🎬\nEnter the name of the movie you'd like to request:");
        if (!title || title.trim() === "") return;

        try {
            const res = await fetch('/api/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: title.trim() })
            });

            const data = await res.json();

            if (res.ok) {
                alert(`Request received: "${title}"\nWe'll look into it!`);
            } else {
                const errMsg = data.error || 'Unknown error';
                if (errMsg.includes('auth') || errMsg.includes('connection')) {
                    alert(`⚠️ Database Error: ${errMsg}\n(You are seeing this because the local DB connection failed. The site is running on static data, but saving new requests requires a live DB.)`);
                } else {
                    alert(`Failed to send request: ${errMsg}`);
                }
            }
        } catch (err) {
            console.error("Request Fetch Error:", err);
            alert('Error sending request. Check console for details.');
        }
    };

    // --- Report Feature ---
    const openReportModal = () => {
        setShowPreMessage(true); // Always start with pre-message
        setShowReportModal(true);
    };

    const closeReportModal = () => {
        setShowReportModal(false);
        setShowPreMessage(true); // Reset for next open
        setReportName('');
        setReportMsg('');
    };

    const handleReportSubmit = async (e) => {
        e.preventDefault();
        if (!reportMsg.trim()) return;

        setIsSubmitting(true);

        try {
            const res = await fetch('/api/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: reportName.trim(),
                    message: reportMsg.trim(),
                    path: window.location.pathname // Capture where they are reporting from
                })
            });

            const data = await res.json();
            console.log("Report Response:", data); // Debug

            if (res.ok) {
                alert("Thanks! 🚨 Report received.");
                closeReportModal();
            } else {
                const errMsg = data.error || 'Unknown error';
                if (errMsg.includes('auth') || errMsg.includes('connection')) {
                    alert(`⚠️ Database Error: ${errMsg}\n(You are seeing this because the local DB connection failed. The site is running on static data, but saving new reports requires a live DB.)`);
                } else {
                    alert(`❌ Failed to send report: ${errMsg}`);
                }
            }
        } catch (err) {
            console.error("Report Fetch Error:", err);
            alert("Error sending report. Check console for details.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const [showMenu, setShowMenu] = useState(false);

    return (
        <>
            <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50 items-end">
                {/* Menu Items (Slide Up Animation) */}
                <div className={`flex flex-col gap-3 transition-all duration-300 origin-bottom ${showMenu ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95 pointer-events-none'}`}>

                    {/* Request Item - Site Glass Style */}
                    <button
                        onClick={() => { handleRequest(); setShowMenu(false); }}
                        className="fab-site-item fab-site-orange"
                    >
                        <span className="fab-site-text">Request Film</span>
                        <span className="fab-site-icon">🎬</span>
                    </button>

                    {/* Report Item - Site Glass Style */}
                    <button
                        onClick={() => { openReportModal(); setShowMenu(false); }}
                        className="fab-site-item fab-site-red"
                    >
                        <span className="fab-site-text">Report Issue</span>
                        <span className="fab-site-icon">🚨</span>
                    </button>
                </div>

                {/* Main FAB - Site Glassmorphic Circle */}
                <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="fab-site-main"
                >
                    <span className={`fab-site-main-icon ${showMenu ? 'rotate-45' : 'rotate-0'}`}>+</span>
                </button>
            </div>

            {/* HIGH VISIBILITY GLASS STYLES (90% Opacity) */}
            <style jsx global>{`
                /* ===== MENU ITEMS - HIGH VISIBLITY GLASS ===== */
                .fab-site-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 18px;
                    border-radius: 14px;
                    
                    /* High Vis Dark Glass (90%) */
                    background: rgba(10, 10, 10, 0.9);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    
                    /* Distinct border */
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    
                    /* Strong shadow */
                    box-shadow: 
                        0 4px 16px rgba(0, 0, 0, 0.5),
                        0 2px 6px rgba(0, 0, 0, 0.3);
                    
                    cursor: pointer;
                    color: white;
                    pointer-events: auto;
                    
                    transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }

                .fab-site-item:hover {
                    transform: translateY(-2px) translateX(-4px);
                    background: rgba(20, 20, 20, 1.0); /* Solid on hover */
                    border-color: rgba(255, 255, 255, 0.4);
                    box-shadow: 
                        0 8px 24px rgba(0, 0, 0, 0.6),
                        0 4px 12px rgba(0, 0, 0, 0.4);
                }

                .fab-site-item:active {
                    transform: scale(0.96);
                }

                /* Orange accent glow */
                .fab-site-orange {
                    border-left: 2px solid rgba(249, 115, 22, 0.8);
                }
                .fab-site-orange:hover {
                    border-color: rgba(249, 115, 22, 1);
                    box-shadow: 
                        0 8px 24px rgba(0, 0, 0, 0.6),
                        0 0 15px rgba(249, 115, 22, 0.3);
                }

                /* Red accent glow */
                .fab-site-red {
                    border-left: 2px solid rgba(239, 68, 68, 0.8);
                }
                .fab-site-red:hover {
                    border-color: rgba(239, 68, 68, 1);
                    box-shadow: 
                        0 8px 24px rgba(0, 0, 0, 0.6),
                        0 0 15px rgba(239, 68, 68, 0.3);
                }

                .fab-site-text {
                    font-size: 0.875rem;
                    font-weight: 700;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
                }

                .fab-site-icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 28px;
                    height: 28px;
                    border-radius: 8px;
                    background: rgba(255, 255, 255, 0.15);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    font-size: 1rem;
                }

                /* ===== MAIN FAB BUTTON - HIGH VISIBILITY ===== */
                .fab-site-main {
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 52px;
                    height: 52px;
                    border-radius: 50%;
                    cursor: pointer;
                    z-index: 50;
                    
                    /* High Vis Dark Glass (90%) */
                    background: rgba(10, 10, 10, 0.9);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    
                    /* Distinct Accent Border */
                    border: 1px solid rgba(255, 107, 107, 0.6);
                    
                    /* Strong Shadow */
                    box-shadow: 
                        0 4px 16px rgba(0, 0, 0, 0.5),
                        0 2px 8px rgba(0, 0, 0, 0.3),
                        0 0 10px rgba(255, 107, 107, 0.2);
                    
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }

                .fab-site-main:hover {
                    transform: scale(1.1) rotate(90deg); /* Playful rotate on hover */
                    background: rgba(255, 107, 107, 0.95); /* Accent color on hover */
                    border-color: white;
                    box-shadow: 
                        0 8px 24px rgba(255, 107, 107, 0.5),
                        0 4px 12px rgba(0, 0, 0, 0.4);
                }

                .fab-site-main:active {
                    transform: scale(0.9);
                }

                /* Plus icon */
                .fab-site-main-icon {
                    font-size: 1.75rem;
                    font-weight: 300;
                    color: rgba(255, 107, 107, 1);
                    text-shadow: 0 0 5px rgba(255, 107, 107, 0.5);
                    line-height: 1;
                    transition: all 0.3s ease;
                }

                .fab-site-main:hover .fab-site-main-icon {
                    color: white; /* White icon on accent hover bg */
                    text-shadow: none;
                }

                /* Responsive */
                @media (max-width: 640px) {
                    .fab-site-main {
                        width: 46px;
                        height: 46px;
                    }
                    
                    .fab-site-main-icon {
                        font-size: 1.5rem;
                    }
                    
                    .fab-site-item {
                        padding: 10px 14px;
                    }
                    
                    .fab-site-text {
                        font-size: 0.8rem;
                    }
                }
            `}</style>



            {/* Report Modal */}
            {showReportModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-[90%] max-w-md bg-[var(--card-bg)] border border-white/10 p-6 rounded-2xl shadow-2xl relative">
                        <button
                            onClick={closeReportModal}
                            className="absolute top-4 right-4 text-[var(--muted)] hover:text-white text-2xl"
                        >
                            &times;
                        </button>

                        {/* Step 1: Pre-Message with Social Links */}
                        {showPreMessage ? (
                            <div className="text-center">
                                <div className="text-4xl mb-4">💬</div>
                                <h2 className="text-xl font-bold mb-3 text-white">Before You Report</h2>
                                <p className="text-[var(--muted)] text-sm mb-4 leading-relaxed">
                                    If your issue is <strong className="text-white">serious or urgent</strong>, please reach out directly for faster resolution:
                                </p>

                                {/* Social Links */}
                                <div className="flex flex-col gap-3 mb-6">
                                    <a
                                        href="https://t.me/cineamore"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#0088cc]/20 border border-[#0088cc]/30 text-[#0088cc] hover:bg-[#0088cc]/30 transition-colors font-semibold"
                                    >
                                        <span>💬</span>
                                        <span>Join Telegram Group</span>
                                    </a>
                                    <a
                                        href="https://x.com/__Sithlord__"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#1d9bf0]/20 border border-[#1d9bf0]/30 text-[#1d9bf0] hover:bg-[#1d9bf0]/30 transition-colors font-semibold"
                                    >
                                        <span>🐦</span>
                                        <span>DM on Twitter/X</span>
                                    </a>
                                </div>

                                <p className="text-[var(--muted)] text-xs mb-4">
                                    Joining Telegram or Twitter helps me fix issues <strong className="text-[var(--accent)]">faster</strong>!
                                </p>

                                <button
                                    onClick={() => setShowPreMessage(false)}
                                    className="w-full bg-white/10 border border-white/20 text-white font-bold py-3 rounded-xl hover:bg-white/20 transition-colors"
                                >
                                    Continue to Report Form →
                                </button>
                            </div>
                        ) : (
                            /* Step 2: Report Form */
                            <>
                                <button
                                    onClick={() => setShowPreMessage(true)}
                                    className="text-[var(--muted)] text-sm hover:text-white mb-3 flex items-center gap-1"
                                >
                                    ← Back
                                </button>
                                <h2 className="text-2xl font-bold mb-4 text-white">Report an Issue</h2>
                                <form onSubmit={handleReportSubmit} className="flex flex-col gap-4">
                                    <input
                                        type="text"
                                        placeholder="Your Name (Optional)"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--accent)] transition-colors"
                                        value={reportName}
                                        onChange={(e) => setReportName(e.target.value)}
                                    />
                                    <textarea
                                        placeholder="Describe the issue..."
                                        rows="4"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--accent)] transition-colors"
                                        value={reportMsg}
                                        onChange={(e) => setReportMsg(e.target.value)}
                                        required
                                    ></textarea>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-[var(--accent)] text-black font-bold py-3 rounded-xl hover:bg-[var(--accent2)] transition-colors disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Sending...' : 'Send Report'}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

