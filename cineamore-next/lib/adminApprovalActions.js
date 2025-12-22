'use server';

import dbConnect from '@/lib/mongodb';
import Movie from '@/models/Movie';
import PendingChange from '@/models/PendingChange';
import { revalidatePath } from 'next/cache';
import { isAdmin, getSession } from '@/lib/auth';
import mongoose from 'mongoose';

/**
 * Approve a pending change
 */
export async function approvePendingChange(pendingId) {
    const admin = await isAdmin();
    if (!admin) {
        return { error: 'Unauthorized' };
    }

    await dbConnect();

    const pending = await PendingChange.findById(pendingId);
    if (!pending) {
        return { error: 'Pending change not found' };
    }

    if (pending.status !== 'pending') {
        return { error: 'This change has already been processed' };
    }

    const session = await getSession();

    try {
        // Execute the change based on type
        if (pending.type === 'create') {
            // Create new movie
            const newObjectId = new mongoose.Types.ObjectId();
            const legacyId = `m${newObjectId.toString().slice(-8)}`;

            await Movie.create({
                _id: newObjectId,
                __id: legacyId,
                ...pending.movieData,
                addedAt: new Date()
            });
        } else if (pending.type === 'update') {
            // Update existing movie
            await Movie.findByIdAndUpdate(pending.movieId, pending.movieData);
        } else if (pending.type === 'delete') {
            // Delete movie
            await Movie.findByIdAndDelete(pending.movieId);
        }

        // Mark as approved
        pending.status = 'approved';
        pending.reviewedAt = new Date();
        pending.reviewedBy = session?.user || 'admin';
        await pending.save();

        revalidatePath('/');
        revalidatePath('/admin');
        revalidatePath('/admin/pending');
        revalidatePath('/contributor');

        return { success: true };
    } catch (e) {
        return { error: 'Failed to apply change: ' + e.message };
    }
}

/**
 * Reject a pending change with optional note
 */
export async function rejectPendingChange(pendingId, note = '') {
    const admin = await isAdmin();
    if (!admin) {
        return { error: 'Unauthorized' };
    }

    await dbConnect();

    const pending = await PendingChange.findById(pendingId);
    if (!pending) {
        return { error: 'Pending change not found' };
    }

    if (pending.status !== 'pending') {
        return { error: 'This change has already been processed' };
    }

    const session = await getSession();

    pending.status = 'rejected';
    pending.reviewedAt = new Date();
    pending.reviewedBy = session?.user || 'admin';
    pending.reviewNotes = note || null;
    await pending.save();

    revalidatePath('/admin/pending');
    revalidatePath('/contributor');

    return { success: true };
}

/**
 * Bulk approve multiple pending changes
 */
export async function bulkApprovePendingChanges(pendingIds) {
    const admin = await isAdmin();
    if (!admin) {
        return { error: 'Unauthorized' };
    }

    await dbConnect();

    const results = { approved: 0, errors: [] };

    for (const id of pendingIds) {
        const result = await approvePendingChange(id);
        if (result.success) {
            results.approved++;
        } else {
            results.errors.push({ id, error: result.error });
        }
    }

    return results;
}

/**
 * Bulk reject multiple pending changes
 */
export async function bulkRejectPendingChanges(pendingIds, note = '') {
    const admin = await isAdmin();
    if (!admin) {
        return { error: 'Unauthorized' };
    }

    await dbConnect();

    const results = { rejected: 0, errors: [] };

    for (const id of pendingIds) {
        const result = await rejectPendingChange(id, note);
        if (result.success) {
            results.rejected++;
        } else {
            results.errors.push({ id, error: result.error });
        }
    }

    return results;
}

/**
 * Discard (delete) a pending change
 */
export async function discardPendingChange(pendingId) {
    const admin = await isAdmin();
    if (!admin) {
        return { error: 'Unauthorized' };
    }

    await dbConnect();

    try {
        await PendingChange.findByIdAndDelete(pendingId);
        revalidatePath('/admin/pending');
        return { success: true };
    } catch (e) {
        return { error: 'Failed to discard: ' + e.message };
    }
}
