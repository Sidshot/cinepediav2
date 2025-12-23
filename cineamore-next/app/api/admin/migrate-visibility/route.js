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
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json(
                { error: 'Unauthorized. Admin access required.' },
                { status: 403 }
            );
        }

        // 2. Connect to DB
        await dbConnect();

        // 3. Get all movies and check what needs migration
        console.log('🔍 Starting visibility migration...');
        const allMovies = await Movie.find({});
        console.log(`📊 Found ${allMovies.length} total movies`);

        let quarantined = 0;
        let visible = 0;
        let alreadyMigrated = 0;

        const bulkOps = [];

        for (const movie of allMovies) {
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
        }

        if (bulkOps.length > 0) {
            console.log(`🚀 Executing ${bulkOps.length} updates...`);
            const result = await Movie.bulkWrite(bulkOps);
            console.log('✅ Migration Complete');

            return NextResponse.json({
                success: true,
                message: 'Migration completed successfully',
                stats: {
                    totalMovies: allMovies.length,
                    migrated: bulkOps.length,
                    quarantined,
                    visible,
                    alreadyMigrated,
                    bulkWriteResult: {
                        modifiedCount: result.modifiedCount,
                        matchedCount: result.matchedCount
                    }
                }
            });
        } else {
            return NextResponse.json({
                success: true,
                message: 'All movies already have visibility.state field',
                stats: {
                    totalMovies: allMovies.length,
                    alreadyMigrated
                }
            });
        }

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
