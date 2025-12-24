'use server';

import dbConnect from '@/lib/mongodb';
import Movie from '@/models/Movie';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import mongoose from 'mongoose';
import logger from '@/lib/logger';
import { getSession, isAdmin } from '@/lib/auth';
import { getTMDBRating } from '@/lib/tmdb';

// Validation Schema
const MovieSchema = z.object({
    title: z.string().min(1, "Title is required"),
    year: z.coerce.number().min(1888, "Year must be valid"),
    director: z.string().optional(),
    original: z.string().optional(),
    plot: z.string().optional(),
    notes: z.string().optional(),
    lb: z.string().url("Invalid Letterboxd URL").optional().or(z.literal('')),
    lb: z.string().url("Invalid Letterboxd URL").optional().or(z.literal('')),
    poster: z.string().optional(), // TMDB path or full URL
    genre: z.string().optional(), // Comma separated string from form
    // For now we handle downloads as a JSON string or simplified
    downloadLinks: z.string().optional() // We'll parse this from a textarea "Label|URL" per line
});

export async function createMovie(formData) {
    if (!await isAdmin()) {
        throw new Error("Unauthorized: Admin access required");
    }
    await dbConnect();

    const rawData = {
        title: formData.get('title'),
        year: formData.get('year'),
        director: formData.get('director'),
        original: formData.get('original'),
        plot: formData.get('plot'),
        notes: formData.get('notes'),
        lb: formData.get('lb'),
        poster: formData.get('poster'),
        genre: formData.get('genre'),
        downloadLinks: formData.get('downloadLinks')
    };

    const validated = MovieSchema.safeParse(rawData);

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    const { downloadLinks, genre, ...movieData } = validated.data;

    // Parse Genre: "Action, Drama" -> ["Action", "Drama"]
    const genreArray = genre ? genre.split(',').map(g => g.trim()).filter(Boolean) : [];

    // Parse Download Links (Format: "Label | URL" per line)
    const parsedLinks = [];
    if (downloadLinks) {
        downloadLinks.split('\n').forEach(line => {
            const [label, url] = line.split('|').map(s => s.trim());
            if (label && url) parsedLinks.push({ label, url });
        });
    }

    // Create New Movie
    // Generate a legacy-like pseudo-random ID for __id if needed, or just let schema handle it if defaulted
    // For backward compatibility, we assign __id = _id string if not provided
    const _id = new mongoose.Types.ObjectId();

    // Auto-fetch TMDB Rating
    let tmdbRating = 0;
    try {
        const rating = await getTMDBRating(movieData.title, movieData.year);
        if (rating !== null) tmdbRating = rating;
    } catch (e) {
        console.warn('Failed to fetch TMDB rating:', e.message);
    }

    try {
        await Movie.create({
            _id,
            __id: _id.toString(), // Use the new ID as the legacy ID for new items
            ...movieData,
            genre: genreArray,
            downloadLinks: parsedLinks,
            tmdbRating,
            addedAt: new Date()
        });

        const session = await getSession();
        logger.audit(session?.user || 'unknown_admin', 'CREATE_MOVIE', _id.toString(), { title: movieData.title });
    } catch (e) {
        return { error: "Failed to create movie. " + e.message };
    }

    revalidatePath('/');
    revalidatePath('/admin');
    redirect('/admin');
}

export async function updateMovie(id, formData) {
    if (!await isAdmin()) {
        throw new Error("Unauthorized: Admin access required");
    }
    await dbConnect();

    const rawData = {
        title: formData.get('title'),
        year: formData.get('year'),
        director: formData.get('director'),
        original: formData.get('original'),
        plot: formData.get('plot'),
        notes: formData.get('notes'),
        lb: formData.get('lb'),
        poster: formData.get('poster'),
        genre: formData.get('genre'),
        downloadLinks: formData.get('downloadLinks')
    };

    const validated = MovieSchema.safeParse(rawData);

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    const { downloadLinks, genre, ...movieData } = validated.data;

    // Parse Genre
    const genreArray = genre ? genre.split(',').map(g => g.trim()).filter(Boolean) : [];

    // Parse Download Links
    const parsedLinks = [];
    if (downloadLinks) {
        downloadLinks.split('\n').forEach(line => {
            const [label, url] = line.split('|').map(s => s.trim());
            if (label && url) parsedLinks.push({ label, url });
        });
    }

    try {
        await Movie.findByIdAndUpdate(id, {
            ...movieData,
            genre: genreArray,
            downloadLinks: parsedLinks
        });

        const session = await getSession();
        logger.audit(session?.user || 'unknown_admin', 'UPDATE_MOVIE', id, { title: movieData.title });
    } catch (e) {
        return { error: "Failed to update movie. " + e.message };
    }

    revalidatePath('/');
    revalidatePath('/admin');
    revalidatePath(`/movie/${id}`);
    redirect('/admin'); // Or back to edit page
}

export async function deleteMovie(id) {
    if (!await isAdmin()) {
        throw new Error("Unauthorized: Admin access required");
    }
    await dbConnect();
    const movie = await Movie.findByIdAndDelete(id);
    const session = await getSession();
    if (movie) {
        logger.audit(session?.user || 'unknown_admin', 'DELETE_MOVIE', id, { title: movie.title });
    }
    revalidatePath('/admin');
    revalidatePath('/');
}
