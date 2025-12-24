import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';
import { decrypt } from './lib/edge/session'; // Static Import for safety

/**
 * Rate Limiter Factory
 * Production: Upstash Redis | Local Dev: Simple Map fallback
 */
function getRateLimiter(type) {
    try {
        // Prod: Upstash
        if (process.env.UPSTASH_REDIS_REST_URL) {
            const redis = Redis.fromEnv();

            // Tune limits
            switch (type) {
                case 'download': return new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(100, '15 m'), Analytics: true, prefix: 'rl_dl' });
                case 'api': return new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(200, '1 m'), Analytics: true, prefix: 'rl_api' });
                case 'listing': return new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(100, '1 m'), Analytics: true, prefix: 'rl_list' });
                case 'detail': return new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(200, '1 m'), Analytics: true, prefix: 'rl_mov' });
                default: return new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(200, '1 m'), Analytics: true, prefix: 'rl_gen' });
            }
        }
    } catch (e) {
        console.warn('Redis Init Failed:', e);
    }

    // Local Dev Fallback
    return {
        limit: async (ip) => {
            return { success: true, pending: Promise.resolve(), limit: 100, remaining: 99, reset: 0 };
        }
    };
}

/**
 * Vercel Edge Middleware
 */
export async function middleware(request) {
    try {
        const { pathname } = request.nextUrl;
        const ip = request.ip || '127.0.0.1';
        const userAgent = request.headers.get('user-agent') || '';

        // 1. 🤖 BOT BLOCKER
        const badBots = ['curl', 'wget', 'python', 'scrapy', 'go-http-client', 'java'];
        if (badBots.some(bot => userAgent.toLowerCase().includes(bot))) {
            return new NextResponse(JSON.stringify({ error: 'Access Denied', message: 'Bot detected.' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
        }

        // 2. 🚦 RATE LIMITING (Skip internal/static)
        if (!pathname.startsWith('/_next') && !pathname.includes('.')) {
            // Whitelist Check
            const whitelistedIPs = (process.env.WHITELISTED_IPS || '').split(',').filter(Boolean);
            if (whitelistedIPs.includes(ip)) return NextResponse.next();

            // Admin Check (Skip Rate Limit)
            const sessionCookie = request.cookies.get('session')?.value;
            let isAdminUser = false;

            if (sessionCookie) {
                const session = await decrypt(sessionCookie);
                if (session && session.role === 'admin') isAdminUser = true;
            }

            if (!isAdminUser) {
                let limiter;
                if (pathname.startsWith('/api/download')) limiter = getRateLimiter('download');
                else if (pathname.startsWith('/api')) limiter = getRateLimiter('api');
                else if (pathname === '/' || pathname.startsWith('/search')) limiter = getRateLimiter('listing');
                else if (pathname.startsWith('/movie/')) limiter = getRateLimiter('detail');
                else limiter = getRateLimiter('default');

                try {
                    const { success, limit, remaining, reset } = await limiter.limit(ip);

                    const res = NextResponse.next();
                    res.headers.set('X-RateLimit-Limit', limit.toString());
                    res.headers.set('X-RateLimit-Remaining', remaining.toString());

                    if (!success) {
                        const retryAfterSeconds = Math.ceil((reset - Date.now()) / 1000);
                        return new NextResponse(JSON.stringify({ error: 'Too Many Requests', retryAfter: retryAfterSeconds }), { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': retryAfterSeconds.toString() } });
                    }
                    console.log(`[RateLimit] Allowed ${ip} (Rem: ${remaining})`);

                    return res;
                } catch (e) {
                    console.warn('[RateLimit] Circuit Breaker Activated:', e.message);
                    // FAIL OPEN: Allow request if rate limiter fails
                    return NextResponse.next();
                }
            }
        }

        // 3. 🔐 AUTHENTICATION
        if (pathname.startsWith('/admin') || pathname.startsWith('/contributor')) {
            const sessionCookie = request.cookies.get('session')?.value;
            if (!sessionCookie) return NextResponse.redirect(new URL('/login', request.url));

            const session = await decrypt(sessionCookie);
            if (!session) return NextResponse.redirect(new URL('/login', request.url));

            if (pathname.startsWith('/admin') && session.role !== 'admin') return NextResponse.redirect(new URL('/contributor', request.url));
            if (pathname.startsWith('/contributor') && session.role !== 'contributor') return NextResponse.redirect(new URL('/admin', request.url));
        }

        return NextResponse.next();

    } catch (error) {
        console.error('CRITICAL MIDDLEWARE ERROR:', error);

        // 🛡️ SECURITY & UX: Never show stack traces to users.
        // Return a friendly Maintenance Page instead.
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Maintenance - CineAmore</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background: #0a0a0a; color: #ededed; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; padding: 20px; }
                .container { max-width: 400px; }
                h1 { margin-bottom: 10px; font-size: 24px; }
                p { color: #888; line-height: 1.6; margin-bottom: 20px; }
                .btn { display: inline-block; background: #ededed; color: #000; text-decoration: none; padding: 10px 20px; border-radius: 9999px; font-weight: 500; font-size: 14px; transition: opacity 0.2s; }
                .btn:hover { opacity: 0.9; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Site Under Maintenance</h1>
                <p>We are currently performing scheduled maintenance to improve your experience. We'll be back shortly.</p>
                <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                    <a href="https://x.com/__Sithlord__" target="_blank" class="btn">Contact on X</a>
                    <a href="mailto:indocurry@proton.me" class="btn">Email Support</a>
                </div>
            </div>
        </body>
        </html>
        `;

        return new NextResponse(html, {
            status: 503,
            headers: {
                'Content-Type': 'text/html',
                'Cache-Control': 'no-store'
            }
        });
    }
}

export const config = {
    matcher: ['/', '/movie/:path*', '/api/:path*', '/admin/:path*', '/contributor/:path*', '/search'],
};
