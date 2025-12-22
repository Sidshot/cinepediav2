'use server';

import dbConnect from '@/lib/mongodb';
import Movie from '@/models/Movie';
import PendingChange from '@/models/PendingChange';
import { revalidatePath } from 'next/cache';
import { getSession, isContributor } from '@/lib/auth';

/**
 * Create a pending movie (contributor creates new movie)
 */
export async function createPendingMovie(formData) {
    const session = await getSession();
    if (!session || (session.role !== 'contributor' && session.role !== 'admin')) {
        return { error: 'Unauthorized' };
    }

    await dbConnect();

    // Parse form data (same as admin createMovie)
    const movieData = {
        title: formData.get('title')?.trim(),
        year: parseInt(formData.get('year')) || null,
        director: formData.get('director')?.trim() || '',
        original: formData.get('original')?.trim() || '',
        plot: formData.get('plot')?.trim() || '',
        lb: formData.get('lb')?.trim() || '',
        poster: formData.get('poster')?.trim() || '',
        notes: formData.get('notes')?.trim() || '',
    };

    // Parse genre
    const genreStr = formData.get('genre')?.trim() || '';
    movieData.genre = genreStr ? genreStr.split(',').map(g => g.trim()).filter(Boolean) : [];

    // Parse download links
    const downloadLinksStr = formData.get('downloadLinks')?.trim() || '';
    movieData.downloadLinks = [];
    if (downloadLinksStr) {
        downloadLinksStr.split('\n').forEach(line => {
            const [label, url] = line.split('|').map(s => s.trim());
            if (label && url) movieData.downloadLinks.push({ label, url });
        });
    }

    // Validate
    if (!movieData.title || movieData.title.length < 1) {
        return { error: 'Title is required' };
    }

    try {
        await PendingChange.create({
            type: 'create',
            movieId: null,
            movieData,
            previousData: null,
            contributorId: session.contributorId,
            contributorUsername: session.user,
            status: 'pending'
        });

        revalidatePath('/contributor');
        return { success: true, message: 'Movie submitted for review' };
    } catch (e) {
        return { error: 'Failed to submit: ' + e.message };
    }
}

/**
 * Create a pending update (contributor edits existing movie)
 */
export async function updatePendingMovie(movieId, formData) {
    const session = await getSession();
    if (!session || (session.role !== 'contributor' && session.role !== 'admin')) {
        return { error: 'Unauthorized' };
    }

    await dbConnect();

    // Get current movie data for diff
    const currentMovie = await Movie.findById(movieId).lean();
    if (!currentMovie) {
        return { error: 'Movie not found' };
    }

    // Parse form data
    const movieData = {
        title: formData.get('title')?.trim(),
        year: parseInt(formData.get('year')) || null,
        director: formData.get('director')?.trim() || '',
        original: formData.get('original')?.trim() || '',
        plot: formData.get('plot')?.trim() || '',
        lb: formData.get('lb')?.trim() || '',
        poster: formData.get('poster')?.trim() || '',
        notes: formData.get('notes')?.trim() || '',
    };

    // Parse genre
    const genreStr = formData.get('genre')?.trim() || '';
    movieData.genre = genreStr ? genreStr.split(',').map(g => g.trim()).filter(Boolean) : [];

    // Parse download links
    const downloadLinksStr = formData.get('downloadLinks')?.trim() || '';
    movieData.downloadLinks = [];
    if (downloadLinksStr) {
        downloadLinksStr.split('\n').forEach(line => {
            const [label, url] = line.split('|').map(s => s.trim());
            if (label && url) movieData.downloadLinks.push({ label, url });
        });
    }

    // Prepare previous data snapshot
    const previousData = {
        title: currentMovie.title,
        year: currentMovie.year,
        director: currentMovie.director,
        original: currentMovie.original,
        plot: currentMovie.plot,
        lb: currentMovie.lb,
        poster: currentMovie.poster,
        notes: currentMovie.notes,
        genre: currentMovie.genre || [],
        downloadLinks: currentMovie.downloadLinks || []
    };

    try {
        await PendingChange.create({
            type: 'update',
            movieId: currentMovie._id,
            movieData,
            previousData,
            contributorId: session.contributorId,
            contributorUsername: session.user,
            status: 'pending'
        });

        revalidatePath('/contributor');
        return { success: true, message: 'Update submitted for review' };
    } catch (e) {
        return { error: 'Failed to submit: ' + e.message };
    }
}

/**
 * Create a pending delete (contributor requests movie deletion)
 */
export async function deletePendingMovie(movieId) {
    const session = await getSession();
    if (!session || (session.role !== 'contributor' && session.role !== 'admin')) {
        return { error: 'Unauthorized' };
    }

    await dbConnect();

    // Get current movie data
    const currentMovie = await Movie.findById(movieId).lean();
    if (!currentMovie) {
        return { error: 'Movie not found' };
    }

    // Store minimal data for display
    const movieData = {
        title: currentMovie.title,
        year: currentMovie.year,
        director: currentMovie.director
    };

    const previousData = {
        title: currentMovie.title,
        year: currentMovie.year,
        director: currentMovie.director,
        original: currentMovie.original,
        plot: currentMovie.plot,
        poster: currentMovie.poster,
        genre: currentMovie.genre || []
    };

    try {
        await PendingChange.create({
            type: 'delete',
            movieId: currentMovie._id,
            movieData,
            previousData,
            contributorId: session.contributorId,
            contributorUsername: session.user,
            status: 'pending'
        });

        revalidatePath('/contributor');
        return { success: true, message: 'Deletion request submitted for review' };
    } catch (e) {
        return { error: 'Failed to submit: ' + e.message };
    }
}
