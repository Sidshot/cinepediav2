'use client';

import { useState, useEffect } from 'react';

/**
 * Donation Appeal Banner
 * - Asks users to support CineAmore with donations
 * - Shows Twitter and Telegram links for updates
 * - User must wait 5 seconds before dismissing
 * - Once dismissed permanently, never shows again (localStorage)
 * - Glossy iOS style matching site aesthetic
 */
const PERMANENT_KEY = 'donationBannerV2_Jan2026'; // Versioned key - change to force all users to see new banner

export default function PromoBanner({ showOnlyOnHome = true }) {
  const [isVisible, setIsVisible] = useState(false);
  const [canDismiss, setCanDismiss] = useState(false);
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    // Check if banner should show
    const isPermanentlyDismissed = typeof window !== 'undefined' &&
      localStorage.getItem(PERMANENT_KEY) === 'true';

    if (!isPermanentlyDismissed) {
      setIsVisible(true);
    }
  }, []);

  // 5-second countdown timer
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanDismiss(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible]);

  // Lock body scroll when banner is visible
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isVisible]);

  const handleDismiss = () => {
    if (!canDismiss) return;
    localStorage.setItem(PERMANENT_KEY, 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="promo-banner-overlay">
      <div className="promo-banner-content">
        {/* Banner Content */}
        <div className="promo-inner">
          {/* Decorative Elements */}
          <div className="promo-glow promo-glow-1" />
          <div className="promo-glow promo-glow-2" />

          {/* Icon */}
          <div className="promo-icon">
            💛🙏
          </div>

          {/* Title */}
          <h2 className="promo-title">
            Support CineAmore 💛
          </h2>

          {/* Main Message */}
          <p className="promo-subtitle">
            So far, CineAmore has been a <strong>hobby project</strong> run by a single person,
            with all costs covered out of pocket. As the site grows, it's becoming harder to
            keep up with <strong>rising expenses</strong>.
          </p>
          <p className="promo-subtitle donation-appeal">
            I kindly request you to <strong className="donate-highlight">DONATE</strong> anything
            you can to keep this alive. Currently, the donation page is being set up.
          </p>

          {/* Social Links Section */}
          <div className="promo-tips">
            <div className="promo-tip social-tip">
              <span className="tip-icon">📢</span>
              <span>
                Follow on{' '}
                <a
                  href="https://x.com/__Sithlord__"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="twitter-link"
                >
                  Twitter
                </a>
                {' '}for updates on donations!
              </span>
            </div>
            <div className="promo-tip social-tip telegram-tip">
              <span className="tip-icon">💬</span>
              <span>
                Join our{' '}
                <a
                  href="https://t.me/cineamore"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="telegram-link"
                >
                  Telegram Group
                </a>
                {' '}for instant access to admin and swift updates!
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="promo-actions">
            {canDismiss ? (
              <button onClick={handleDismiss} className="promo-btn-primary">
                <span>Access CineAmore</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <p className="countdown-text">
                Please read... Access in {countdown} second{countdown !== 1 ? 's' : ''}
              </p>
            )}
          </div>
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
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          animation: fadeIn 0.4s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .promo-banner-content {
          position: relative;
          max-width: 520px;
          width: 90%;
          /* Solid dark background for maximum readability */
          background: linear-gradient(
            145deg,
            rgb(18, 18, 22) 0%,
            rgb(25, 25, 30) 100%
          );
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-top: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 28px;
          padding: 40px 32px;
          text-align: center;
          box-shadow: 
            0 25px 50px -12px rgba(0, 0, 0, 0.9),
            0 0 80px rgba(0, 0, 0, 0.5),
            inset 0 0 0 1px rgba(255, 255, 255, 0.08);
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
          filter: blur(50px);
          opacity: 0.15;
          pointer-events: none;
        }

        .promo-glow-1 {
          width: 200px;
          height: 200px;
          background: #fbbf24; /* Gold donation color */
          top: -80px;
          left: -60px;
        }

        .promo-glow-2 {
          width: 180px;
          height: 180px;
          background: #f472b6; /* Pink heart accent */
          bottom: -60px;
          right: -40px;
        }

        .promo-icon {
          font-size: 48px;
          margin-bottom: 16px;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .promo-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--fg);
          margin: 0 0 16px 0;
          letter-spacing: -0.5px;
          background: linear-gradient(135deg, var(--fg) 0%, #f59e0b 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .promo-subtitle {
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.85);
          margin: 0 0 16px 0;
          line-height: 1.7;
        }

        .promo-subtitle.donation-appeal {
          margin-bottom: 24px;
        }

        .promo-subtitle strong {
          color: var(--fg);
        }

        .donate-highlight {
          color: #fbbf24 !important;
          font-size: 1.1em;
          text-shadow: 0 0 12px rgba(251, 191, 36, 0.5);
        }

        .promo-tips {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 28px;
          text-align: left;
        }

        .promo-tip {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          font-size: 0.88rem;
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.5;
        }

        .twitter-link {
          color: #1d9bf0;
          font-weight: 700;
          text-decoration: none;
          background: rgba(29, 155, 240, 0.15);
          padding: 2px 8px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .twitter-link:hover {
          background: rgba(29, 155, 240, 0.3);
          text-decoration: underline;
        }

        .telegram-link {
          color: #0088cc;
          font-weight: 700;
          text-decoration: none;
          background: rgba(0, 136, 204, 0.15);
          padding: 2px 8px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .telegram-link:hover {
          background: rgba(0, 136, 204, 0.3);
          text-decoration: underline;
        }

        .promo-tip.social-tip {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.15);
        }

        .promo-tip.telegram-tip {
          background: rgba(0, 136, 204, 0.08);
          border-color: rgba(0, 136, 204, 0.2);
        }

        .promo-tip strong {
          color: var(--fg);
        }

        .countdown-text {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.95rem;
          font-style: italic;
          padding: 14px 0;
          animation: countdownPulse 1.5s ease-in-out infinite;
        }

        @keyframes countdownPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        .tip-icon {
          font-size: 1.2rem;
          flex-shrink: 0;
        }

        .promo-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .promo-btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 14px 28px;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: #000;
          font-weight: 700;
          font-size: 0.95rem;
          border: none;
          border-radius: 99px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 
            0 8px 24px rgba(245, 158, 11, 0.35),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }

        .promo-btn-primary:hover {
          transform: translateY(-3px) scale(1.03);
          box-shadow: 
            0 12px 32px rgba(245, 158, 11, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.4);
        }

        .promo-btn-primary svg {
          transition: transform 0.2s ease;
        }

        .promo-btn-primary:hover svg {
          transform: scale(1.1);
        }

        .promo-btn-secondary {
          display: block;
          background: none;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: var(--muted);
          font-size: 0.9rem;
          font-weight: 600;
          padding: 12px 24px;
          border-radius: 99px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .promo-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.3);
          color: var(--fg);
        }

        @media (max-width: 480px) {
          .promo-banner-content {
            padding: 32px 24px;
            margin: 16px;
          }

          .promo-title {
            font-size: 1.4rem;
          }

          .promo-subtitle {
            font-size: 0.9rem;
          }

          .promo-tip {
            font-size: 0.82rem;
            padding: 10px 12px;
          }

          .promo-btn-primary {
            padding: 12px 24px;
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
}
