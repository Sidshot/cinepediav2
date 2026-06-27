import { NextResponse } from 'next/server';

const ALLOWED_IMAGE_HOSTS = new Set([
    'image.tmdb.org',
    'www.themoviedb.org',
    'themoviedb.org',
    'tmdb.org',
    'www.tmdb.org',
]);

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function isAllowedImageHost(hostname) {
    return ALLOWED_IMAGE_HOSTS.has(hostname.toLowerCase());
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
        return new NextResponse('Missing URL parameter', { status: 400 });
    }

    let targetUrl;
    try {
        targetUrl = new URL(url);
    } catch (error) {
        return new NextResponse('Invalid URL parameter', { status: 400 });
    }

    if (targetUrl.protocol !== 'https:' || !isAllowedImageHost(targetUrl.hostname)) {
        return new NextResponse('Image host not allowed', { status: 403 });
    }

    try {
        const response = await fetch(targetUrl.toString(), {
            signal: AbortSignal.timeout(5000),
            redirect: 'follow',
        });

        if (!response.ok) {
            return new NextResponse('Failed to fetch image', { status: response.status });
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.toLowerCase().startsWith('image/')) {
            return new NextResponse('Upstream response is not an image', { status: 415 });
        }

        const contentLength = Number(response.headers.get('content-length') || 0);
        if (contentLength > MAX_IMAGE_BYTES) {
            return new NextResponse('Image too large', { status: 413 });
        }

        const headers = new Headers();
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        headers.set('Content-Type', contentType);

        if (contentLength > 0) {
            headers.set('Content-Length', String(contentLength));
        }

        return new NextResponse(response.body, {
            status: 200,
            headers,
        });
    } catch (error) {
        console.error('Image Proxy Error:', error);
        return new NextResponse('Image fetch failed', { status: 502 });
    }
}
