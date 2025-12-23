
import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error('No Mongo URI');

const Movie = mongoose.models.Movie || mongoose.model('Movie', new mongoose.Schema({ hidden: Boolean }, { strict: false }));

async function check() {
    await mongoose.connect(MONGODB_URI);

    const total = await Movie.countDocuments({});
    const hidden = await Movie.countDocuments({ hidden: true });
    const visible = await Movie.countDocuments({ hidden: { $ne: true } });

    console.log(`VISIBLE: ${visible}`);
    console.log(`HIDDEN: ${hidden}`);
    console.log(`TOTAL: ${total}`);

    await mongoose.disconnect();
}

check();
