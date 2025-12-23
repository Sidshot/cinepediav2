// Quick script to check quarantined films
import dbConnect from '../lib/mongodb.js';
import Movie from '../models/Movie.js';

await dbConnect();

console.log('🔍 Fetching quarantined films...\n');

const quarantined = await Movie.find({
    'visibility.state': 'quarantined'
})
    .select('title year director visibility')
    .limit(50)
    .lean();

console.log(`Found ${quarantined.length} quarantined films (showing first 50):\n`);

quarantined.forEach((movie, i) => {
    console.log(`${i + 1}. "${movie.title}" (${movie.year || 'N/A'})`);
    console.log(`   Reason: ${movie.visibility?.reason || 'Unknown'}`);
    console.log('');
});

// Get total count
const total = await Movie.countDocuments({ 'visibility.state': 'quarantined' });
console.log(`\n📊 Total quarantined: ${total} films`);

process.exit(0);
