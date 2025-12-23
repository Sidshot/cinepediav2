import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Movie from '@/models/Movie';

/**
 * Admin endpoint to view quarantined films
 */
export async function GET(request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await dbConnect();

        const quarantined = await Movie.find({
            'visibility.state': 'quarantined'
        })
            .select('title year director visibility _id')
            .sort({ title: 1 })
            .limit(100)
            .lean();

        const total = await Movie.countDocuments({ 'visibility.state': 'quarantined' });

        return NextResponse.json({
            success: true,
            total,
            showing: quarantined.length,
            films: quarantined.map(f => ({
                id: f._id.toString(),
                title: f.title,
                year: f.year,
                director: f.director,
                reason: f.visibility?.reason
            }))
        });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * Admin endpoint to update a quarantined film's title
 */
export async function POST(request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { filmId, newTitle, newYear, unquarantine } = await request.json();

        if (!filmId) {
            return NextResponse.json({ error: 'Film ID required' }, { status: 400 });
        }

        await dbConnect();

        const update = {};
        if (newTitle) update.title = newTitle;
        if (newYear !== undefined) update.year = newYear;

        // If unquarantine flag is set, change visibility to visible
        if (unquarantine) {
            update['visibility.state'] = 'visible';
            update['visibility.reason'] = null;
            update['visibility.updatedAt'] = new Date();
        }

        const result = await Movie.findByIdAndUpdate(
            filmId,
            { $set: update },
            { new: true }
        );

        if (!result) {
            return NextResponse.json({ error: 'Film not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'Film updated successfully',
            film: {
                id: result._id.toString(),
                title: result.title,
                year: result.year,
                visibility: result.visibility
            }
        });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
