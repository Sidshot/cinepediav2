import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// --- AUTH CONFIG ---
const secretKey = process.env.JWT_SECRET || 'default-secret-key-change-me-in-prod';
const key = new TextEncoder().encode(secretKey);

async function verifySession(token) {
    try {
        const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
        return payload;
    } catch {
        return null;
    }
}

// --- RATE LIMIT CONFIG (Defined here to avoid instantiating on every request if possible, but middleware edge constraints might require it inside) ---
// We use a Map for local dev fallback if Redis envs are missing
const localCache = new Map();

function getRateLimiter(type) {
    // Prod: Upstash
    if (process.env.UPSTASH_REDIS_REST_URL) {
        const redis = Redis.fromEnv();

        // Tune limits based on abuse patterns (Stricter V2)
        switch (type) {
            case 'download': return new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(3, '15 m'), Analytics: true, prefix: 'rl_dl' }); // 3 per 15m
            case 'api': return new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, '1 m'), Analytics: true, prefix: 'rl_api' });
            case 'listing': return new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '1 m'), Analytics: true, prefix: 'rl_list' }); // 10 per 1m
            case 'detail': return new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, '1 m'), Analytics: true, prefix: 'rl_mov' }); // 30 per 1m
            default: return new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(100, '1 m'), Analytics: true, prefix: 'rl_gen' });
        }
    }

    // Local Dev Fallback (Simple Map)
    return {
        limit: async (ip) => {
            return { success: true, pending: Promise.resolve(), limit: 100, remaining: 99, reset: 0 };
        }
    };
}


export async function middleware(request) {
    const { pathname } = request.nextUrl;
    const ip = request.ip || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    // 1. 🤖 BOT BLOCKER (UA Filter + Header Coherence)
    const badBots = ['curl', 'wget', 'python', 'scrapy', 'go-http-client', 'java'];

    // A. Basic UA Filter
    if (badBots.some(bot => userAgent.toLowerCase().includes(bot))) {
        return new NextResponse('Access Denied', { status: 403 });
    }

    // B. Header Coherence (Anti-Spoofing)
    if (userAgent.includes('Mozilla/5.0')) {
        const secChUa = request.headers.get('sec-ch-ua');
        const secFetchSite = request.headers.get('sec-fetch-site');

        // Chrome claims usually require consistency
        if (userAgent.includes('Chrome')) {
            // If Sec-Fetch-Site exists (modern browser feature) but Sec-CH-UA is missing -> Suspicious
            if (secFetchSite && !secChUa) {
                return new NextResponse('Access Denied (Header Mismatch)', { status: 403 });
            }
        }
    }

    // 2. 🚦 RATE LIMITING (Skip for static assets)
    if (!pathname.startsWith('/_next') && !pathname.includes('.')) {
        let limiter;

        if (pathname.startsWith('/api/download')) limiter = getRateLimiter('download');
        else if (pathname.startsWith('/api')) limiter = getRateLimiter('api');
        else if (pathname === '/' || pathname.startsWith('/search')) limiter = getRateLimiter('listing'); // Stricter for listings
        else if (pathname.startsWith('/movie/')) limiter = getRateLimiter('detail');
        else limiter = getRateLimiter('default');

        const { success, limit, remaining, reset } = await limiter.limit(ip);

        // Add headers for observability
        const res = NextResponse.next();
        res.headers.set('X-RateLimit-Limit', limit.toString());
        res.headers.set('X-RateLimit-Remaining', remaining.toString());

        if (!success) {
            return new NextResponse('Too Many Requests', {
                status: 429,
                headers: { 'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString() }
            });
        }
    }

    // 3. 🔐 AUTHENTICATION (Admin/Contributor)
    if (pathname.startsWith('/admin') || pathname.startsWith('/contributor')) {
        const sessionCookie = request.cookies.get('session')?.value;
        const session = sessionCookie ? await verifySession(sessionCookie) : null;

        if (pathname.startsWith('/admin')) {
            if (!session || !session.user) {
                const loginUrl = new URL('/login', request.url);
                loginUrl.searchParams.set('callbackUrl', request.url);
                return NextResponse.redirect(loginUrl);
            }
            if (session.role && session.role !== 'admin') {
                return NextResponse.redirect(new URL('/contributor', request.url));
            }
        }

        if (pathname.startsWith('/contributor')) {
            if (!session || !session.user) {
                const loginUrl = new URL('/login', request.url);
                loginUrl.searchParams.set('callbackUrl', request.url);
                return NextResponse.redirect(loginUrl);
            }
            if (session.role !== 'contributor' && session.role !== 'admin') {
                return NextResponse.redirect(new URL('/login', request.url));
            }
        }
    }

    return NextResponse.next();
}

export const config = {
    // Match root, movie, api, admin, etc. Exclude static files.
    matcher: ['/', '/movie/:path*', '/api/:path*', '/admin/:path*', '/contributor/:path*', '/search'],
};
