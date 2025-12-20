'use client';

import { useState, useEffect } from 'react';

/**
 * Promotional Banner for CineStats
 * - Shows until EXPIRY_DATE (40 days from Dec 20, 2025 = Jan 29, 2026)
 * - User can dismiss it (session only - reappears on reload)
 * - Glossy iOS style matching site aesthetic
 */
const EXPIRY_DATE = new Date('2026-01-29T23:59:59');

export default function PromoBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if banner should show (only checks expiry - session-based dismissal)
    const now = new Date();
    const isExpired = now > EXPIRY_DATE;

    if (!isExpired) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    // Session-only dismissal - banner will reappear on page reload
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="promo-banner-overlay">
      <div className="promo-banner-content">
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="promo-close-btn"
          aria-label="Close banner"
        >
          ✕
        </button>

        {/* Banner Content */}
        <div className="promo-inner">
          {/* Decorative Elements */}
          <div className="promo-glow promo-glow-1" />
          <div className="promo-glow promo-glow-2" />

          {/* Icon */}
          <div className="promo-icon">
            🎬✨
          </div>

          {/* Text */}
          <h2 className="promo-title">
            Your Year in Film Awaits
          </h2>
          <p className="promo-subtitle">
            Discover your Letterboxd wrapped — see your most-watched genres,
            directors, and viewing patterns of 2025!
          </p>

          {/* CTA Button */}
          <a
            href="https://sidshot.github.io/cinestats/"
            target="_blank"
            rel="noopener noreferrer"
            className="promo-cta"
          >
            <span>Generate My CineStats</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 17L17 7" />
              <path d="M7 7h10v10" />
            </svg>
          </a>

          {/* Skip Link */}
          <button onClick={handleDismiss} className="promo-skip">
            Skip and browse films →
          </button>
        </div>
      </div>

      <style jsx>{`
        .promo-banner-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          animation: fadeIn 0.4s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .promo-banner-content {
          position: relative;
          max-width: 480px;
          width: 90%;
          background: linear-gradient(
            145deg,
            rgba(255, 255, 255, 0.08) 0%,
            rgba(255, 255, 255, 0.02) 100%
          );
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-top: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 24px;
          padding: 40px 32px;
          text-align: center;
          box-shadow: 
            0 25px 50px rgba(0, 0, 0, 0.5),
            inset 0 0 0 1px rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          overflow: hidden;
          animation: slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .promo-close-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.1);
          color: var(--muted);
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }

        .promo-close-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          color: var(--fg);
          transform: scale(1.1);
        }

        .promo-inner {
          position: relative;
          z-index: 2;
        }

        .promo-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          opacity: 0.4;
          pointer-events: none;
        }

        .promo-glow-1 {
          width: 200px;
          height: 200px;
          background: var(--accent);
          top: -80px;
          left: -60px;
        }

        .promo-glow-2 {
          width: 180px;
          height: 180px;
          background: var(--accent2);
          bottom: -60px;
          right: -40px;
        }

        .promo-icon {
          font-size: 48px;
          margin-bottom: 16px;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        .promo-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--fg);
          margin: 0 0 12px 0;
          letter-spacing: -0.5px;
          background: linear-gradient(135deg, var(--fg) 0%, var(--accent) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .promo-subtitle {
          font-size: 0.95rem;
          color: var(--muted);
          margin: 0 0 28px 0;
          line-height: 1.6;
        }

        .promo-cta {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 14px 28px;
          background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%);
          color: #000;
          font-weight: 700;
          font-size: 0.95rem;
          border-radius: 99px;
          text-decoration: none;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 
            0 8px 24px rgba(255, 192, 67, 0.35),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }

        .promo-cta:hover {
          transform: translateY(-3px) scale(1.03);
          box-shadow: 
            0 12px 32px rgba(255, 192, 67, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.4);
        }

        .promo-cta svg {
          transition: transform 0.2s ease;
        }

        .promo-cta:hover svg {
          transform: translate(2px, -2px);
        }

        .promo-skip {
          display: block;
          margin: 20px auto 0;
          background: none;
          border: none;
          color: var(--muted);
          font-size: 0.85rem;
          cursor: pointer;
          transition: color 0.2s ease;
          padding: 8px;
        }

        .promo-skip:hover {
          color: var(--fg);
        }

        @media (max-width: 480px) {
          .promo-banner-content {
            padding: 32px 24px;
            margin: 16px;
          }

          .promo-title {
            font-size: 1.5rem;
          }

          .promo-subtitle {
            font-size: 0.9rem;
          }

          .promo-cta {
            padding: 12px 24px;
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
}
