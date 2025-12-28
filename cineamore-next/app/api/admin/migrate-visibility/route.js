import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Movie from '@/models/Movie';

/**
 * Admin-only endpoint to migrate legacy 'hidden' field to 'visibility' object
 * AND ensure all movies have a visibility field with proper state
 * 
 * Usage: POST to /api/admin/migrate-visibility
 * Requires: Admin authentication
 */
export async function POST(request) {
    try {
        // 1. Check Authentication
        const { isAdmin } = await import('@/lib/auth');
        if (!await isAdmin()) {
            return NextResponse.json(
                { error: 'Unauthorized: Admin access required' },
                { status: 403 }
            );
        }

        // 2. Connect to DB
        await dbConnect();

        // 3. Get all movies via cursor for Memory Safety (Stream, don't load all)
        console.log('🔍 Starting visibility migration (Streaming Mode)...');

        // Count first for stats (fast)
        const totalCount = await Movie.countDocuments({});
        console.log(`📊 Found ${totalCount} total movies`);

        let processed = 0;
        let quarantined = 0;
        let visible = 0;
        let alreadyMigrated = 0;
        const bulkOps = [];
        const BATCH_SIZE = 1000;

        // Use cursor to iterate without flooding RAM
        const cursor = Movie.find({}).cursor();

        for (let movie = await cursor.next(); movie != null; movie = await cursor.next()) {
            processed++;

            // Skip if already has proper visibility field with state
            if (movie.visibility && movie.visibility.state) {
                alreadyMigrated++;
                continue;
            }

            // Use dot notation for nested MongoDB fields
            const update = {
                $set: {}
            };

            // If has legacy hidden field, handle it
            if (movie.hidden !== undefined) {
                if (movie.hidden === true) {
                    update.$set['visibility.state'] = 'quarantined';
                    update.$set['visibility.reason'] = 'Legacy hidden flag migration';
                    update.$set['visibility.updatedAt'] = new Date();
                    quarantined++;
                } else {
                    update.$set['visibility.state'] = 'visible';
                    update.$set['visibility.reason'] = null;
                    update.$set['visibility.updatedAt'] = new Date();
                    visible++;
                }
                update.$unset = { hidden: "" };
            }
            // No visibility.state field - add default visible
            else {
                update.$set['visibility.state'] = 'visible';
                update.$set['visibility.reason'] = null;
                update.$set['visibility.updatedAt'] = new Date();
                visible++;
            }

            bulkOps.push({
                updateOne: {
                    filter: { _id: movie._id },
                    update: update
                }
            });

            // Execute in batches to keep memory low
            if (bulkOps.length >= BATCH_SIZE) {
                await Movie.bulkWrite(bulkOps);
                bulkOps.length = 0; // Clear array
                console.log(`...processed ${processed}/${totalCount}`);
            }
        }

        // Process remaining batch
        if (bulkOps.length > 0) {
            await Movie.bulkWrite(bulkOps);
        }

        console.log('✅ Migration Complete');

        return NextResponse.json({
            success: true,
            message: 'Migration completed successfully',
            stats: {
                totalMovies: totalCount,
                processed: processed,
                quarantined,
                visible,
                alreadyMigrated
            }
        });

    } catch (error) {
        console.error('❌ Migration Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Migration failed',
                details: error.message
            },
            { status: 500 }
        );
    }
}
