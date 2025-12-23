
import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) throw new Error('No Mongo URI');

const MovieSchema = new mongoose.Schema({ hidden: Boolean }, { strict: false });
const Movie = mongoose.models.Movie || mongoose.model('Movie', MovieSchema);

async function quarantine() {
    console.log('🔌 Connecting...');
    await mongoose.connect(MONGODB_URI);

    console.log('🧹 Searching for bad data...');

    // Find movies that SHOULD be hidden but aren't
    const result = await Movie.updateMany(
        {
            hidden: { $ne: true }, // Not already hidden
            $or: [
                { genre: 'Uncategorized' },
                { genre: { $size: 0 } },
                { poster: { $exists: false } },
                { poster: null },
                { poster: '' },
                { plot: { $exists: false } },
                { plot: '' }
            ]
        },
        { $set: { hidden: true } }
    );

    console.log(`\n🚫 QUARANTINED ${result.modifiedCount} movies.`);
    console.log('These movies are now hidden from the site until the enrichment script fixes them.');

    await mongoose.disconnect();
}

quarantine();
