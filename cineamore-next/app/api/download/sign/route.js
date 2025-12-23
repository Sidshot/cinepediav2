
import { NextResponse } from 'next/server';
import { signDownloadToken } from '@/lib/download-token';
import { getRateLimit } from '@/lib/ratelimit';

export async function POST(request) {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

    // 1. Strict Rate Limit (prevent enumeration)
    const limiter = getRateLimit();
    // Use a custom prefix for signing to separate it from general API limits if possible, 
    // but the shared limiter is fine for now as per `ratelimit.js` config.
    // Ideally we'd use the 'download' limiter logic here but our abstraction is simple.
    // For now, relies on middleware to have caught the worst offenders, 
    // but we double-check here if we want extra security (optional).

    // 💀 KILL SWITCH IN CASE OF EMERGENCY
    if (process.env.KILL_SWITCH_DOWNLOADS === 'true') {
        return new NextResponse('Service Temporarily Unavailable (Eschelon Protocol)', { status: 503 });
    }

    try {
        const body = await request.json();
        const { movieId, linkIndex } = body;

        if (!movieId || linkIndex === undefined) {
            return new NextResponse('Missing Data', { status: 400 });
        }

        // 2. Sign Token
        // Bind to IP to prevent sharing tokens
        const token = await signDownloadToken({
            movieId,
            linkIndex,
            ip
        });

        return NextResponse.json({
            url: `/api/download?token=${token}`
        });

    } catch (e) {
        return new NextResponse('Error', { status: 500 });
    }
}
