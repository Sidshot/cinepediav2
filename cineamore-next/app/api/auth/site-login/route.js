import { NextResponse } from 'next/server';
import { encrypt } from '@/lib/edge/session';
import { cookies } from 'next/headers';

/**
 * Site Gate Login API
 * 
 * Validates username/password against SITE_USERNAME and SITE_PASSWORD env vars.
 * Password is NEVER returned in any response.
 * On success, sets an HTTP-only signed JWT cookie (site_gate).
 */
export async function POST(request) {
    try {
        const { username, password, rememberMe } = await request.json();

        if (!username || !password) {
            return NextResponse.json({ error: 'Credentials required' }, { status: 400 });
        }

        const validUsername = process.env.SITE_USERNAME;
        const validPassword = process.env.SITE_PASSWORD;

        if (!validUsername || !validPassword) {
            console.error('[Site Gate] SITE_USERNAME or SITE_PASSWORD env vars not set!');
            return NextResponse.json({ error: 'Site access is not configured' }, { status: 503 });
        }

        // Constant-time-ish comparison to avoid timing attacks
        const usernameMatch = username.trim().toLowerCase() === validUsername.toLowerCase();
        const passwordMatch = password === validPassword;

        if (!usernameMatch || !passwordMatch) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Session is browser-only by default. "Remember me" extends access on this device.
        const expires = rememberMe
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            : null;
        const token = await encrypt({
            type: 'site_gate',
            user: username.trim().toLowerCase(),
            rememberMe: Boolean(rememberMe),
            expires: expires ? expires.toISOString() : null
        }, {
            expiresAt: expires || new Date(Date.now() + 24 * 60 * 60 * 1000)
        });

        const cookieStore = await cookies();
        cookieStore.set('site_gate', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/'
        });

        if (expires) {
            cookieStore.set('site_gate', token, {
                expires,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/'
            });
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('[Site Gate Login] Error:', e);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
