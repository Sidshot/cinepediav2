/**
 * Cleanup Script: Delete movies with numeric titles
 * Run with: node scripts/cleanup-numeric-titles.mjs
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment');
    process.exit(1);
}

// Define schema
const MovieSchema = new mongoose.Schema({
    title: String
}, { strict: false });

const Movie = mongoose.models.Movie || mongoose.model('Movie', MovieSchema);

async function cleanup() {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected!\n');

    // Find movies where title matches only digits
    const numericMovies = await Movie.find({
        title: { $regex: /^\d+$/ }
    }).select('title _id').lean();

    console.log(`📊 Found ${numericMovies.length} movies with numeric titles\n`);

    if (numericMovies.length === 0) {
        console.log('✨ Nothing to clean up!');
        await mongoose.disconnect();
        return;
    }

    // Show first 10
    console.log('Sample titles to delete:');
    numericMovies.slice(0, 10).forEach(m => console.log(`  - "${m.title}"`));
    if (numericMovies.length > 10) {
        console.log(`  ... and ${numericMovies.length - 10} more\n`);
    }

    // Delete them
    const result = await Movie.deleteMany({ title: { $regex: /^\d+$/ } });
    console.log(`\n🗑️  Deleted ${result.deletedCount} movies with numeric titles`);

    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
}

cleanup().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
