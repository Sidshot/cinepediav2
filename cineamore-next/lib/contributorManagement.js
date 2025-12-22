'use server';

import dbConnect from '@/lib/mongodb';
import Contributor from '@/models/Contributor';
import { revalidatePath } from 'next/cache';
import { isAdmin } from '@/lib/auth';

/**
 * Create a new contributor account
 */
export async function createContributor(formData) {
    const admin = await isAdmin();
    if (!admin) {
        return { error: 'Unauthorized' };
    }

    await dbConnect();

    const username = formData.get('username')?.trim().toLowerCase().replace(/^@/, ''); // Strip leading @
    const password = formData.get('password')?.trim();
    const displayName = formData.get('displayName')?.trim() || '';

    if (!username || username.length < 3) {
        return { error: 'Username must be at least 3 characters' };
    }

    if (!password || password.length < 4) {
        return { error: 'Password must be at least 4 characters' };
    }

    // Check for existing username
    const existing = await Contributor.findOne({ username });
    if (existing) {
        return { error: 'Username already exists' };
    }

    try {
        await Contributor.create({
            username,
            password,
            displayName,
            isActive: true,
            createdBy: 'admin'
        });

        revalidatePath('/admin/contributors');
        return { success: true };
    } catch (e) {
        return { error: 'Failed to create contributor: ' + e.message };
    }
}

/**
 * Update a contributor's details
 */
export async function updateContributor(id, formData) {
    const admin = await isAdmin();
    if (!admin) {
        return { error: 'Unauthorized' };
    }

    await dbConnect();

    const password = formData.get('password')?.trim();
    const displayName = formData.get('displayName')?.trim();
    const isActive = formData.get('isActive') === 'true';

    const updates = { isActive };

    if (password && password.length >= 4) {
        updates.password = password;
    }

    if (displayName !== undefined) {
        updates.displayName = displayName;
    }

    try {
        await Contributor.findByIdAndUpdate(id, updates);
        revalidatePath('/admin/contributors');
        return { success: true };
    } catch (e) {
        return { error: 'Failed to update contributor: ' + e.message };
    }
}

/**
 * Delete a contributor account
 */
export async function deleteContributor(id) {
    const admin = await isAdmin();
    if (!admin) {
        return { error: 'Unauthorized' };
    }

    await dbConnect();

    try {
        await Contributor.findByIdAndDelete(id);
        revalidatePath('/admin/contributors');
        return { success: true };
    } catch (e) {
        return { error: 'Failed to delete contributor: ' + e.message };
    }
}
