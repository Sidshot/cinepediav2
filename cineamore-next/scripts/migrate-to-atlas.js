/**
 * Migration Script: Import movies to MongoDB Atlas
 * Run: node scripts/migrate-to-atlas.js
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Atlas connection string
const ATLAS_URI = 'mongodb+srv://admin:mongoadmin@cluster0.lallguq.mongodb.net/cinepedia?retryWrites=true&w=majority&appName=Cluster0';

// Movie schema (simplified for import)
const MovieSchema = new mongoose.Schema({}, { strict: false });
const Movie = mongoose.model('Movie', MovieSchema);

async function migrate() {
    console.log('🚀 Starting migration to MongoDB Atlas...\n');

    try {
        // Connect to Atlas
        console.log('📡 Connecting to Atlas...');
        await mongoose.connect(ATLAS_URI);
        console.log('✅ Connected to Atlas!\n');

        // Load movies from JSON
        const jsonPath = path.join(__dirname, '..', 'lib', 'movies.json');
        console.log(`📂 Loading movies from: ${jsonPath}`);
        const movies = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        console.log(`✅ Loaded ${movies.length} movies\n`);

        // Clear existing movies and drop problematic indexes
        console.log('🗑️  Clearing existing movies in Atlas...');
        await Movie.deleteMany({});

        // Drop unique index on __id if it exists
        try {
            await mongoose.connection.collection('movies').dropIndex('__id_1');
            console.log('📑 Dropped __id index');
        } catch (e) {
            console.log('📑 No __id index to drop (or already dropped)');
        }
        console.log('✅ Cleared!\n');

        // Insert movies in batches (remove old _id to generate new ones)
        const BATCH_SIZE = 500;
        let inserted = 0;

        console.log('📤 Inserting movies...');
        for (let i = 0; i < movies.length; i += BATCH_SIZE) {
            const batch = movies.slice(i, i + BATCH_SIZE).map(movie => {
                const { _id, ...rest } = movie; // Remove old _id
                return rest;
            });
            await Movie.insertMany(batch, { ordered: false });
            inserted += batch.length;
            console.log(`   Progress: ${inserted}/${movies.length}`);
        }

        console.log(`\n🎉 SUCCESS! Migrated ${inserted} movies to Atlas!\n`);
        console.log('You can now refresh https://cineamore.vercel.app to see your films.\n');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('📴 Disconnected from Atlas.');
    }
}

migrate();
