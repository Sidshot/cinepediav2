'use server';

import dbConnect from './mongodb';
import List from '@/models/List';
import { auth } from './auth-next';
import { revalidatePath } from 'next/cache';

/**
 * Get the current authenticated user's ID
 */
async function getCurrentUserId() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('You must be logged in to perform this action');
    }
    return session.user.id;
}

/**
 * Create a new list
 */
export async function createList(formData) {
    const userId = await getCurrentUserId();
    await dbConnect();

    const title = formData.get('title') || formData.title;
    const description = formData.get('description') || formData.description || '';
    const type = formData.get('type') || formData.type || 'custom';
    const isPublic = formData.get('isPublic') === 'true' || formData.isPublic || false;

    if (!title || title.trim().length === 0) {
        return { error: 'Title is required' };
    }

    try {
        const list = await List.create({
            owner: userId,
            title: title.trim(),
            description: description.trim(),
            type,
            isPublic,
            movies: []
        });

        revalidatePath('/lists');
        return { success: true, listId: list._id.toString() };
    } catch (error) {
        console.error('Error creating list:', error);
        return { error: 'Failed to create list' };
    }
}

/**
 * Get all lists for the current user
 */
export async function getUserLists() {
    const userId = await getCurrentUserId();
    await dbConnect();

    try {
        const lists = await List.find({ owner: userId })
            .sort({ updatedAt: -1 })
            .populate('movies', 'title year poster _id')
            .lean();

        // Serialize ObjectIds
        return lists.map(list => ({
            ...list,
            _id: list._id.toString(),
            owner: list.owner.toString(),
            movies: list.movies.map(m => ({
                ...m,
                _id: m._id.toString()
            })),
            createdAt: list.createdAt.toISOString(),
            updatedAt: list.updatedAt.toISOString()
        }));
    } catch (error) {
        console.error('Error fetching lists:', error);
        return [];
    }
}

/**
 * Get a single list by ID (with access control)
 */
export async function getListById(listId) {
    await dbConnect();

    try {
        const list = await List.findById(listId)
            .populate('owner', 'name image')
            .populate('movies', 'title year poster director _id __id')
            .lean();

        if (!list) {
            return { error: 'List not found' };
        }

        // Check access - public lists are viewable by anyone
        const session = await auth();
        const isOwner = session?.user?.id === list.owner._id.toString();

        if (!list.isPublic && !isOwner) {
            return { error: 'This list is private' };
        }

        // Serialize
        return {
            ...list,
            _id: list._id.toString(),
            owner: {
                ...list.owner,
                _id: list.owner._id.toString()
            },
            movies: list.movies.map(m => ({
                ...m,
                _id: m._id.toString()
            })),
            isOwner,
            createdAt: list.createdAt.toISOString(),
            updatedAt: list.updatedAt.toISOString()
        };
    } catch (error) {
        console.error('Error fetching list:', error);
        return { error: 'Failed to fetch list' };
    }
}

/**
 * Add a movie to a list
 */
export async function addMovieToList(listId, movieId) {
    const userId = await getCurrentUserId();
    await dbConnect();

    try {
        const list = await List.findOne({ _id: listId, owner: userId });

        if (!list) {
            return { error: 'List not found or access denied' };
        }

        // Check if movie already in list
        if (list.movies.some(m => m.toString() === movieId)) {
            return { error: 'Movie already in list' };
        }

        list.movies.push(movieId);
        await list.save();

        revalidatePath('/lists');
        revalidatePath(`/lists/${listId}`);
        return { success: true };
    } catch (error) {
        console.error('Error adding movie to list:', error);
        return { error: 'Failed to add movie' };
    }
}

/**
 * Remove a movie from a list
 */
export async function removeMovieFromList(listId, movieId) {
    const userId = await getCurrentUserId();
    await dbConnect();

    try {
        const list = await List.findOne({ _id: listId, owner: userId });

        if (!list) {
            return { error: 'List not found or access denied' };
        }

        list.movies = list.movies.filter(m => m.toString() !== movieId);
        await list.save();

        revalidatePath('/lists');
        revalidatePath(`/lists/${listId}`);
        return { success: true };
    } catch (error) {
        console.error('Error removing movie from list:', error);
        return { error: 'Failed to remove movie' };
    }
}

/**
 * Delete a list
 */
export async function deleteList(listId) {
    const userId = await getCurrentUserId();
    await dbConnect();

    try {
        const result = await List.deleteOne({ _id: listId, owner: userId });

        if (result.deletedCount === 0) {
            return { error: 'List not found or access denied' };
        }

        revalidatePath('/lists');
        return { success: true };
    } catch (error) {
        console.error('Error deleting list:', error);
        return { error: 'Failed to delete list' };
    }
}

/**
 * Toggle list visibility (public/private)
 */
export async function toggleListVisibility(listId) {
    const userId = await getCurrentUserId();
    await dbConnect();

    try {
        const list = await List.findOne({ _id: listId, owner: userId });

        if (!list) {
            return { error: 'List not found or access denied' };
        }

        list.isPublic = !list.isPublic;
        await list.save();

        revalidatePath('/lists');
        revalidatePath(`/lists/${listId}`);
        return { success: true, isPublic: list.isPublic };
    } catch (error) {
        console.error('Error toggling visibility:', error);
        return { error: 'Failed to toggle visibility' };
    }
}

/**
 * Quick add to default lists (Watchlist/Favorites)
 * Creates the list if it doesn't exist
 */
export async function quickAddToList(movieId, listType) {
    const userId = await getCurrentUserId();
    await dbConnect();

    try {
        // Find or create the default list
        let list = await List.findOne({ owner: userId, type: listType });

        if (!list) {
            const title = listType === 'watchlist' ? 'Watchlist' : 'Favorites';
            list = await List.create({
                owner: userId,
                title,
                type: listType,
                isPublic: false,
                movies: []
            });
        }

        // Check if movie already in list
        if (list.movies.some(m => m.toString() === movieId)) {
            return { error: 'Movie already in list', alreadyAdded: true };
        }

        list.movies.push(movieId);
        await list.save();

        revalidatePath('/lists');
        return { success: true, listTitle: list.title };
    } catch (error) {
        console.error('Error quick-adding to list:', error);
        return { error: 'Failed to add movie' };
    }
}

/**
 * Check which lists contain a specific movie
 */
export async function getListsContainingMovie(movieId) {
    try {
        const session = await auth();
        if (!session?.user?.id) return [];

        await dbConnect();

        const lists = await List.find({
            owner: session.user.id,
            movies: movieId
        }).select('_id title type').lean();

        return lists.map(l => ({
            _id: l._id.toString(),
            title: l.title,
            type: l.type
        }));
    } catch (error) {
        console.error('Error checking lists:', error);
        return [];
    }
}
