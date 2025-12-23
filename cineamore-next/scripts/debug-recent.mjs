
import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

const Movie = mongoose.models.Movie || mongoose.model('Movie', new mongoose.Schema({}, { strict: false }));

async function debug() {
    await mongoose.connect(MONGODB_URI);

    console.log('🔍 Executing Recent Movies Query...');

    // Exact query from app/page.js
    const recent = await Movie.find({ hidden: { $ne: true } })
        .sort({ addedAt: -1 })
        .limit(10)
        .lean();

    console.log(`Found ${recent.length} movies.`);

    console.log(`Movie Count: ${recent.length}`);
    if (recent.length > 0) {
        console.log(`Top 1: ${recent[0].title} | ${recent[0].addedAt}`);
        console.log(`Top 2: ${recent[1].title} | ${recent[1].addedAt}`);
        console.log(`Top 3: ${recent[2].title} | ${recent[2].addedAt}`);
    }

    await mongoose.disconnect();
}

debug();
