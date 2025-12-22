import mongoose from 'mongoose';

/**
 * Contributor Model
 * Stores contributor accounts managed by admin.
 * Password is stored in plaintext per requirement (admin needs to view/reset).
 */
const ContributorSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        lowercase: true,
        minlength: [3, 'Username must be at least 3 characters']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [4, 'Password must be at least 4 characters']
    },
    displayName: {
        type: String,
        trim: true,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    },
    hasSeenGuide: {
        type: Boolean,
        default: false  // Show guide on first login
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: String,
        default: 'admin'
    }
});

// Index for quick username lookup
ContributorSchema.index({ username: 1 });

// Force schema refresh in development
if (mongoose.models.Contributor) {
    delete mongoose.models.Contributor;
}

export default mongoose.model('Contributor', ContributorSchema);
