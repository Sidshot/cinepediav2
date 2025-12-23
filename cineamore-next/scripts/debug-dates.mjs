
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

    // Check recently added
    const recent = await Movie.find({ hidden: { $ne: true } })
        .sort({ addedAt: -1 })
        .limit(5)
        .lean();

    console.log("--- RECENT MOVIES (DB) ---");
    recent.forEach(m => {
        console.log(`${m.title.substring(0, 20)}... | ${m.addedAt}`);
    });

    // Check a known new movie (from scraper output, e.g. "Dracula")
    const dracula = await Movie.findOne({ title: { $regex: 'Dracula', $options: 'i' } });
    if (dracula) {
        console.log("\n--- DRACULA ---");
        console.log(`Title: ${dracula.title}`);
        console.log(`AddedAt: ${dracula.addedAt}`);
        console.log(`Hidden: ${dracula.hidden}`);
        console.log(`Genre: ${dracula.genre}`);
    }

    await mongoose.disconnect();
}

debug();
