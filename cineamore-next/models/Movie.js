import mongoose from 'mongoose';

const MovieSchema = new mongoose.Schema({
    __id: { type: String, required: true, unique: true }, // Legacy ID
    title: { type: String, required: true },
    original: String,
    year: Number,
    director: String,
    plot: String, // Plot Summary
    genre: { type: [String], default: [] }, // Genre Tags
    lb: String,
    notes: String, // Editor's Notes
    ratingSum: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    downloadLinks: [{
        label: String,
        url: String,
        addedAt: { type: Date, default: Date.now }
    }],
    dl: String,   // Deprecated
    drive: String, // Deprecated
    addedAt: { type: Date, default: Date.now }
});



// FORCE REFRESH: Delete the stale model from Mongoose cache to ensure new schema fields (genre) are recognized
// This fixes the Next.js hot-reload issue where schema updates aren't applied
if (mongoose.models.Movie) {
    delete mongoose.models.Movie;
}

export default mongoose.model('Movie', MovieSchema);
