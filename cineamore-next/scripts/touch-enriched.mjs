
import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

const Movie = mongoose.models.Movie || mongoose.model('Movie', new mongoose.Schema({ hidden: Boolean, addedAt: Date }, { strict: false }));

async function touch() {
    await mongoose.connect(MONGODB_URI);

    console.log('🔄 Bumping timestamps for all visible movies...');

    // Updates all visible movies to have NOW as their added date
    const res = await Movie.updateMany(
        { hidden: { $ne: true } },
        { $set: { addedAt: new Date() } }
    );

    console.log(`✅ Updated ${res.modifiedCount} movies to show as "Just Added".`);

    await mongoose.disconnect();
}

touch();
