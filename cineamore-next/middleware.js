import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

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

export async function middleware(request) {
    const { pathname } = request.nextUrl;
    const sessionCookie = request.cookies.get('session')?.value;
    const session = sessionCookie ? await verifySession(sessionCookie) : null;

    // ADMIN ROUTES: Only allow role: 'admin'
    if (pathname.startsWith('/admin')) {
        if (!session || !session.user) {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('callbackUrl', request.url);
            return NextResponse.redirect(loginUrl);
        }

        // Check for admin role (backward compatible: old sessions without role are admin)
        if (session.role && session.role !== 'admin') {
            return NextResponse.redirect(new URL('/contributor', request.url));
        }
    }

    // CONTRIBUTOR ROUTES: Allow role: 'contributor' OR 'admin'
    if (pathname.startsWith('/contributor')) {
        if (!session || !session.user) {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('callbackUrl', request.url);
            return NextResponse.redirect(loginUrl);
        }

        // Must be contributor or admin
        if (session.role !== 'contributor' && session.role !== 'admin') {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*', '/contributor/:path*'],
};
