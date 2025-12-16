import mongoose from 'mongoose';

const MovieSchema = new mongoose.Schema({
    __id: { type: String, required: true, unique: true }, // Legacy ID
    title: { type: String, required: true },
    original: String,
    year: Number,
    director: String,
    plot: String, // Plot Summary
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

export default mongoose.models.Movie || mongoose.model('Movie', MovieSchema);
