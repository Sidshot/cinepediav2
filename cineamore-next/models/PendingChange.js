import mongoose from 'mongoose';

/**
 * PendingChange Model
 * Stores changes made by contributors awaiting admin approval.
 */
const PendingChangeSchema = new mongoose.Schema({
    // Type of change
    type: {
        type: String,
        enum: ['create', 'update', 'delete'],
        required: true
    },

    // Reference to existing movie (null for 'create')
    movieId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Movie',
        default: null
    },

    // The proposed movie data (full object for create/update)
    movieData: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },

    // Snapshot of movie BEFORE the change (for diff view on updates)
    previousData: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },

    // Contributor who made this change
    contributorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contributor',
        required: true
    },

    // Denormalized for display without join
    contributorUsername: {
        type: String,
        required: true
    },

    // Approval status
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },

    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },

    reviewedAt: {
        type: Date,
        default: null
    },

    reviewedBy: {
        type: String,
        default: null
    },

    // Admin note (especially for rejections)
    reviewNotes: {
        type: String,
        default: null
    }
});

// Indexes for common queries
PendingChangeSchema.index({ status: 1, createdAt: -1 });
PendingChangeSchema.index({ contributorId: 1, status: 1 });
PendingChangeSchema.index({ type: 1 });

// Force schema refresh in development
if (mongoose.models.PendingChange) {
    delete mongoose.models.PendingChange;
}

export default mongoose.model('PendingChange', PendingChangeSchema);
