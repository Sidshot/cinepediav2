import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Movie from '@/models/Movie';

/**
 * Admin-only endpoint to migrate legacy 'hidden' field to 'visibility' object
 * Run this ONCE after deploying the schema changes to production
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

        // 3. Check if already migrated
        const sampleCheck = await Movie.findOne({ hidden: { $exists: true } });
        if (!sampleCheck) {
            return NextResponse.json({
                success: true,
                message: 'Migration already completed (no movies with legacy "hidden" field found)',
                migrated: 0
            });
        }

        // 4. Run Migration
        console.log('🔍 Starting visibility migration...');
        const allMovies = await Movie.find({});
        console.log(`📊 Found ${allMovies.length} total movies`);

        let quarantined = 0;
        let visible = 0;
        let alreadyMigrated = 0;

        const bulkOps = [];

        for (const movie of allMovies) {
            // Skip if already migrated
            if (movie.visibility && movie.visibility.state && movie.hidden === undefined) {
                alreadyMigrated++;
                continue;
            }

            const update = {
                $unset: { hidden: "" },
                $set: {}
            };

            if (movie.hidden === true) {
                update.$set.visibility = {
                    state: 'quarantined',
                    reason: 'Legacy hidden flag migration',
                    updatedAt: new Date()
                };
                quarantined++;
            } else {
                update.$set.visibility = {
                    state: 'visible',
                    reason: null,
                    updatedAt: new Date()
                };
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
                message: 'No migration needed',
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
