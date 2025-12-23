
import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

// Reuse Movie Schema
const MovieSchema = new mongoose.Schema({
    title: { type: String, required: true },
    year: { type: Number },
    downloadLinks: [{
        label: String,
        url: String,
        addedAt: { type: Date, default: Date.now }
    }],
}, { strict: false });

const Movie = mongoose.models.Movie || mongoose.model('Movie', MovieSchema);

function cleanTitle(url) {
    try {
        const decoded = decodeURIComponent(url);
        // GET BASENAME to strip path (The Fix)
        const filename = path.basename(decoded);

        // Remove extension
        const baseName = filename.replace(/\.(mp4|mkv|avi|mov|wmv|m4v)$/i, '');

        // Find year
        const yearMatch = baseName.match(/\b(19|20)\d{2}\b/);
        const year = yearMatch ? parseInt(yearMatch[0]) : null;

        let titlePart = year ? baseName.substring(0, yearMatch.index) : baseName;

        // Clean punctuation
        let title = titlePart
            .replace(/\./g, ' ')
            .replace(/_/g, ' ')
            .replace(/-/g, ' ');

        // Remove junk
        const junk = ['1080p', '720p', '480p', 'BluRay', 'WEB-DL', 'HDRip', 'x264', 'x265', 'AAC', '5.1'];
        junk.forEach(j => {
            title = title.replace(new RegExp(`\\b${j}\\b`, 'gi'), '');
        });

        // Clean whitespace
        title = title.replace(/\s+/g, ' ').trim();
        title = title.replace(/\[.*?\]/g, '').trim();
        title = title.replace(/\(.*?\)/g, '').trim();

        return { title, year };
    } catch (e) {
        return { title: null, year: null };
    }
}

async function fixTitles() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected');

        // Find all movies with potentially bad titles (containing /movies/)
        // Or just process all to be safe? Let's check for /movies/ first.
        const movies = await Movie.find({
            title: { $regex: /movies/, $options: 'i' }
        });

        console.log(`Found ${movies.length} movies with suspicious titles...`);

        let fixed = 0;
        let errors = 0;

        for (const movie of movies) {
            if (!movie.downloadLinks || movie.downloadLinks.length === 0) continue;

            const url = movie.downloadLinks[0].url;
            const { title: newTitle, year: newYear } = cleanTitle(url);

            if (newTitle && newTitle !== movie.title) {
                // print change
                // console.log(`  🔧 Fixing: "${movie.title}" -> "${newTitle}"`);

                movie.title = newTitle;
                if (newYear) movie.year = newYear; // Update year if found

                await movie.save();
                fixed++;

                if (fixed % 50 === 0) process.stdout.write('.');
            }
        }

        console.log(`\n\n🎉 Fixed ${fixed} movie titles.`);

    } catch (error) {
        console.error('CRITICAL ERROR:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected');
    }
}

fixTitles();
