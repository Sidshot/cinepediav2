
import { NextResponse } from 'next/server';
import { verifyDownloadToken } from '@/lib/download-token';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

// Cached connection
let isConnected = false;

// Minimal Movie Model
const Movie = mongoose.models.Movie || mongoose.model('Movie', new mongoose.Schema({
    downloadLinks: Array,
    dl: String,
    drive: String
}, { strict: false }));

async function connectDB() {
    if (isConnected) return;
    try {
        await mongoose.connect(MONGODB_URI);
        isConnected = true;
    } catch (e) {
        console.error('DB Connect Error', e);
    }
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

    // 💀 KILL SWITCH IN CASE OF EMERGENCY
    if (process.env.KILL_SWITCH_DOWNLOADS === 'true') {
        return new NextResponse('Service Temporarily Unavailable (Eschelon Protocol)', { status: 503 });
    }

    if (!token) return new NextResponse('Missing Token', { status: 400 });

    // 1. Verify Token
    const payload = await verifyDownloadToken(token);

    // 2. Security Checks
    if (!payload) {
        return new NextResponse('Invalid or Expired Token', { status: 403 });
    }

    if (payload.ip !== ip) {
        // Token stolen or shared? Block it.
        return new NextResponse('IP Mismatch', { status: 403 });
    }

    try {
        await connectDB();

        // 3. Fetch Real Link
        const movie = await Movie.findById(payload.movieId).select('downloadLinks dl drive');
        if (!movie) return new NextResponse('Movie Not Found', { status: 404 });

        let targetUrl = null;

        // Logic to find the link (supports legacy + new array)
        if (movie.downloadLinks && movie.downloadLinks.length > 0) {
            if (movie.downloadLinks[payload.linkIndex]) {
                targetUrl = movie.downloadLinks[payload.linkIndex].url;
            }
        } else {
            // Fallback for legacy fields
            if (payload.linkIndex === 0) targetUrl = movie.dl || movie.drive;
            else if (payload.linkIndex === 1) targetUrl = movie.drive;
        }

        if (!targetUrl) return new NextResponse('Link Not Found', { status: 404 });

        // 4. The Magic Redirect
        return NextResponse.redirect(targetUrl, 307);

    } catch (e) {
        console.error(e);
        return new NextResponse('Server Error', { status: 500 });
    }
}
