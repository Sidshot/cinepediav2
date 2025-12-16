'use server';

import dbConnect from '@/lib/mongodb';
import Movie from '@/models/Movie';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import mongoose from 'mongoose';

// Validation Schema
const MovieSchema = z.object({
    title: z.string().min(1, "Title is required"),
    year: z.coerce.number().min(1888, "Year must be valid"),
    director: z.string().optional(),
    original: z.string().optional(),
    plot: z.string().optional(),
    notes: z.string().optional(),
    lb: z.string().url("Invalid Letterboxd URL").optional().or(z.literal('')),
    posterUrl: z.string().url("Invalid Poster URL").optional().or(z.literal('')), // Not in DB schema but useful for future
    // For now we handle downloads as a JSON string or simplified
    downloadLinks: z.string().optional() // We'll parse this from a textarea "Label|URL" per line
});

export async function createMovie(formData) {
    await dbConnect();

    const rawData = {
        title: formData.get('title'),
        year: formData.get('year'),
        director: formData.get('director'),
        original: formData.get('original'),
        plot: formData.get('plot'),
        notes: formData.get('notes'),
        lb: formData.get('lb'),
        downloadLinks: formData.get('downloadLinks')
    };

    const validated = MovieSchema.safeParse(rawData);

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    const { downloadLinks, ...movieData } = validated.data;

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

    try {
        await Movie.create({
            _id,
            __id: _id.toString(), // Use the new ID as the legacy ID for new items
            ...movieData,
            downloadLinks: parsedLinks,
            addedAt: new Date()
        });
    } catch (e) {
        return { error: "Failed to create movie. " + e.message };
    }

    revalidatePath('/');
    revalidatePath('/admin');
    redirect('/admin');
}

export async function updateMovie(id, formData) {
    await dbConnect();

    const rawData = {
        title: formData.get('title'),
        year: formData.get('year'),
        director: formData.get('director'),
        original: formData.get('original'),
        plot: formData.get('plot'),
        notes: formData.get('notes'),
        lb: formData.get('lb'),
        downloadLinks: formData.get('downloadLinks')
    };

    const validated = MovieSchema.safeParse(rawData);

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    const { downloadLinks, ...movieData } = validated.data;

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
            downloadLinks: parsedLinks
        });
    } catch (e) {
        return { error: "Failed to update movie. " + e.message };
    }

    revalidatePath('/');
    revalidatePath('/admin');
    revalidatePath(`/movie/${id}`);
    redirect('/admin'); // Or back to edit page
}

export async function deleteMovie(id) {
    await dbConnect();
    await Movie.findByIdAndDelete(id);
    revalidatePath('/admin');
    revalidatePath('/');
}
