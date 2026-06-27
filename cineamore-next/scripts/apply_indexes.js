const mongoose = require('mongoose');

// DB connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is required');
}

const MovieSchema = new mongoose.Schema({
    genre: { type: [String], index: true },
    visibility: { state: { type: String, index: true } }
}, { strict: false });

// Explicitly define indexes to ensure they match what we want
MovieSchema.index({ addedAt: -1 });
MovieSchema.index({ year: -1 });
MovieSchema.index({ genre: 1 });
MovieSchema.index({ 'visibility.state': 1 });
MovieSchema.index({ title: 1 });
MovieSchema.index({ director: 1 });
MovieSchema.index({ original: 1 });

const Movie = mongoose.model('Movie', MovieSchema);

async function applyIndexes() {
    console.log('🔌 Connecting to CINEPEDIA...');
    await mongoose.connect(MONGODB_URI);

    console.log('\n🏗️  Building Indexes...');

    try {
        await Movie.syncIndexes();
        console.log('✅ Indexes synced successfully!');

        // List them to verify
        const indexes = await mongoose.connection.db.collection('movies').indexes();
        console.log('\n📊 Current Indexes:');
        indexes.forEach(idx => console.log(`   - ${idx.name}:`, JSON.stringify(idx.key)));

    } catch (e) {
        console.error('❌ Error building indexes:', e.message);
    }

    await mongoose.disconnect();
}

applyIndexes();
