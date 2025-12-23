import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

/**
 * Rate Limiter Factory
 * Production: Upstash Redis | Local Dev: Simple Map fallback
 */
function getRateLimiter(type) {
    // Prod: Upstash
    if (process.env.UPSTASH_REDIS_REST_URL) {
        const redis = Redis.fromEnv();

        // Tune limits based on abuse patterns (Very Liberal)
        switch (type) {
            case 'download': return new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '15 m'), Analytics: true, prefix: 'rl_dl' }); // 10 per 15m
            case 'api': return new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(200, '1 m'), Analytics: true, prefix: 'rl_api' }); // 200 per 1m
            case 'listing': return new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(100, '1 m'), Analytics: true, prefix: 'rl_list' }); // 100 per 1m
            case 'detail': return new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(200, '1 m'), Analytics: true, prefix: 'rl_mov' }); // 200 per 1m
            default: return new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(200, '1 m'), Analytics: true, prefix: 'rl_gen' });
        }
    }

    // Local Dev Fallback (Simple Map)
    return {
        limit: async (ip) => {
            return { success: true, pending: Promise.resolve(), limit: 100, remaining: 99, reset: 0 };
        }
    };
}

/**
 * Vercel Edge Middleware
 * Runs on EVERY request before page render
 */
export async function middleware(request) {
    const { pathname } = request.nextUrl;
    const ip = request.ip || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    // 1. 🤖 BOT BLOCKER (UA Filter + Header Coherence)
    const badBots = ['curl', 'wget', 'python', 'scrapy', 'go-http-client', 'java'];

    // A. Basic UA Filter
    if (badBots.some(bot => userAgent.toLowerCase().includes(bot))) {
        return new NextResponse(JSON.stringify({
            error: 'Access Denied',
            message: 'Access to this resource has been restricted. Please use a standard web browser.'
        }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // B. Header Coherence (Anti-Spoofing)
    if (userAgent.includes('Mozilla/5.0')) {
        const secChUa = request.headers.get('sec-ch-ua');
        const secFetchSite = request.headers.get('sec-fetch-site');

        // Chrome claims usually require consistency
        if (userAgent.includes('Chrome')) {
            // If Sec-Fetch-Site exists (modern browser feature) but Sec-CH-UA is missing -> Suspicious
            if (secFetchSite && !secChUa) {
                return new NextResponse(JSON.stringify({
                    error: 'Access Denied',
                    message: 'Your browser configuration is not supported. Please try a different browser or disable extensions.'
                }), {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }
    }

    // 2. 🚦 RATE LIMITING (Skip for static assets)
    if (!pathname.startsWith('/_next') && !pathname.includes('.')) {
        // 2a. IP WHITELIST: Always bypass rate limits for whitelisted IPs
        const whitelistedIPs = (process.env.WHITELISTED_IPS || '').split(',').filter(Boolean);

        // Debug logging (remove after confirming it works)
        if (whitelistedIPs.length > 0) {
            console.log(`[Rate Limit] IP: ${ip}, Whitelisted IPs: ${whitelistedIPs.join(', ')}, Match: ${whitelistedIPs.includes(ip)}`);
        }

        if (whitelistedIPs.includes(ip)) {
            return NextResponse.next();
        }

        // 2b. ADMIN SESSION EXEMPTION: Skip rate limiting for logged-in admins
        const sessionCookie = request.cookies.get('session')?.value;
        if (sessionCookie) {
            try {
                const { decrypt } = await import('./lib/auth');
                const session = await decrypt(sessionCookie);
                if (session && session.role === 'admin') {
                    // Admin detected - skip rate limiting
                    return NextResponse.next();
                }
            } catch (e) {
                // Invalid session, continue to rate limiting
            }
        }

        // 2c. Apply rate limits for non-admin/non-whitelisted users
        let limiter;

        if (pathname.startsWith('/api/download')) limiter = getRateLimiter('download');
        else if (pathname.startsWith('/api')) limiter = getRateLimiter('api');
        else if (pathname === '/' || pathname.startsWith('/search')) limiter = getRateLimiter('listing');
        else if (pathname.startsWith('/movie/')) limiter = getRateLimiter('detail');
        else limiter = getRateLimiter('default');

        const { success, limit, remaining, reset } = await limiter.limit(ip);

        // Add headers for observability
        const res = NextResponse.next();
        res.headers.set('X-RateLimit-Limit', limit.toString());
        res.headers.set('X-RateLimit-Remaining', remaining.toString());

        if (!success) {
            const retryAfterSeconds = Math.ceil((reset - Date.now()) / 1000);

            return new NextResponse(JSON.stringify({
                error: 'Too Many Requests',
                message: 'You are browsing too quickly. Please slow down and try again in a moment.'
            }), {
                status: 429,
                headers: {
                    'Content-Type': 'application/json',
                    'Retry-After': retryAfterSeconds.toString()
                }
            });
        }

        return res;
    }

    // 3. 🔐 AUTHENTICATION (Admin/Contributor)
    if (pathname.startsWith('/admin') || pathname.startsWith('/contributor')) {
        const sessionCookie = request.cookies.get('session')?.value;

        if (!sessionCookie) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        try {
            const { decrypt } = await import('./lib/auth');
            const session = await decrypt(sessionCookie);

            if (!session) {
                return NextResponse.redirect(new URL('/login', request.url));
            }

            // Role-based access
            if (pathname.startsWith('/admin') && session.role !== 'admin') {
                return NextResponse.redirect(new URL('/contributor', request.url));
            }
            if (pathname.startsWith('/contributor') && session.role !== 'contributor') {
                return NextResponse.redirect(new URL('/admin', request.url));
            }

            return NextResponse.next();
        } catch (error) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    // Match root, movie, api, admin, etc. Exclude static files.
    matcher: ['/', '/movie/:path*', '/api/:path*', '/admin/:path*', '/contributor/:path*', '/search'],
};
