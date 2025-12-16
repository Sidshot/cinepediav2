/**
 * Migration Script: Consolidate Download Links
 * 
 * This script migrates legacy `dl` and `drive` fields into the new `downloadLinks` array.
 * Run with: node scripts/migrate-download-links.mjs
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment');
    process.exit(1);
}

// Define schema inline to avoid ESM import issues
const MovieSchema = new mongoose.Schema({
    __id: String,
    title: String,
    downloadLinks: [{
        label: String,
        url: String,
        addedAt: { type: Date, default: Date.now }
    }],
    dl: String,
    drive: String
}, { strict: false }); // Allow reading all fields

const Movie = mongoose.models.Movie || mongoose.model('Movie', MovieSchema);

async function migrate() {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected!\n');

    // Find movies with legacy links but empty/missing downloadLinks
    const moviesWithLegacyLinks = await Movie.find({
        $or: [
            { dl: { $exists: true, $ne: null, $ne: '' } },
            { drive: { $exists: true, $ne: null, $ne: '' } }
        ]
    }).lean();

    console.log(`📊 Found ${moviesWithLegacyLinks.length} movies with legacy dl/drive fields\n`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const movie of moviesWithLegacyLinks) {
        const existingLinks = movie.downloadLinks || [];
        const existingUrls = new Set(existingLinks.map(l => l.url));
        const newLinks = [...existingLinks];

        // Add dl if not already in downloadLinks
        if (movie.dl && !existingUrls.has(movie.dl)) {
            newLinks.push({
                label: 'Transfer.it',
                url: movie.dl,
                addedAt: new Date()
            });
        }

        // Add drive if not already in downloadLinks
        if (movie.drive && !existingUrls.has(movie.drive)) {
            newLinks.push({
                label: 'Google Drive',
                url: movie.drive,
                addedAt: new Date()
            });
        }

        // Only update if we added new links
        if (newLinks.length > existingLinks.length) {
            await Movie.updateOne(
                { _id: movie._id },
                {
                    $set: { downloadLinks: newLinks },
                    $unset: { dl: '', drive: '' } // Remove deprecated fields
                }
            );
            console.log(`✅ Migrated: ${movie.title} (${movie.year}) - ${newLinks.length} links`);
            migratedCount++;
        } else {
            skippedCount++;
        }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`   ✅ Migrated: ${migratedCount}`);
    console.log(`   ⏭️  Skipped (already had links): ${skippedCount}`);
    console.log(`   📦 Total processed: ${moviesWithLegacyLinks.length}`);

    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
}

migrate().catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});
