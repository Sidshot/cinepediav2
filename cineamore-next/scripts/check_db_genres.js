
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is missing in .env.local');
    process.exit(1);
}

// Minimal Schema
const MovieSchema = new mongoose.Schema({
    title: String,
    genre: [String],
}, { strict: false });

const Movie = mongoose.models.Movie || mongoose.model('Movie', MovieSchema);

async function checkGenres() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected.');

        const total = await Movie.countDocuments();
        const withGenre = await Movie.countDocuments({ genre: { $exists: true, $not: { $size: 0 } } });
        const withoutGenre = total - withGenre;

        console.log(`\n📊 Genre Statistics:`);
        console.log(`   Total Movies: ${total}`);
        console.log(`   With Genres:  ${withGenre}`);
        console.log(`   Missing Genres: ${withoutGenre}`);

        if (withGenre > 0) {
            const sample = await Movie.findOne({ title: 'The Stranger and the Fog' }).select('title genre');
            console.log('\nSpecific Movie Check:', sample);
        }

        if (withoutGenre > 0) {
            const sampleNoGenre = await Movie.findOne({ genre: { $size: 0 } }).select('title');
            console.log('Example without genre:', sampleNoGenre);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected.');
    }
}

checkGenres();
