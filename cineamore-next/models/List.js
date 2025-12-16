import mongoose from 'mongoose';

const ListSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'List must have an owner'],
        index: true
    },
    title: {
        type: String,
        required: [true, 'List must have a title'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    type: {
        type: String,
        enum: ['watchlist', 'favorites', 'custom'],
        default: 'custom'
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    movies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Movie'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp on save
ListSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

// Compound index for faster user list queries
ListSchema.index({ owner: 1, type: 1 });

// Virtual for movie count
ListSchema.virtual('movieCount').get(function () {
    return this.movies ? this.movies.length : 0;
});

// Ensure virtuals are included in JSON
ListSchema.set('toJSON', { virtuals: true });
ListSchema.set('toObject', { virtuals: true });

export default mongoose.models.List || mongoose.model('List', ListSchema);
