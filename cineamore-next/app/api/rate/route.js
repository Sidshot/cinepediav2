import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Movie from '@/models/Movie';
import { getRateLimit } from '@/lib/ratelimit';

export async function POST(request) {
    try {
        const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
        const { success } = await getRateLimit().limit(`rating:${ip}`);
        if (!success) {
            return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
        }

        const { movieId, rating } = await request.json();

        // Validate
        if (!movieId || !rating || rating < 1 || rating > 5) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }

        await dbConnect();

        // Atomically update rating
        // Increment ratingCount by 1
        // Increment ratingSum by rating value
        const updatedMovie = await Movie.findByIdAndUpdate(
            movieId,
            {
                $inc: { ratingCount: 1, ratingSum: rating }
            },
            { new: true }
        );

        if (!updatedMovie) {
            return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
        }

        // Calculate new average to return
        const newAverage = updatedMovie.ratingSum / updatedMovie.ratingCount;

        return NextResponse.json({
            success: true,
            newAverage,
            newCount: updatedMovie.ratingCount
        });

    } catch (error) {
        console.error('Rating Error:', error);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
