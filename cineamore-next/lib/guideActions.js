'use server';

import dbConnect from '@/lib/mongodb';
import Contributor from '@/models/Contributor';
import { getSession, isContributor } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

/**
 * Mark the contributor's guide as seen
 */
export async function markGuideAsSeen() {
    const session = await getSession();

    if (!session || !session.contributorId) {
        return { error: 'Not authenticated as contributor' };
    }

    await dbConnect();

    try {
        await Contributor.findByIdAndUpdate(session.contributorId, {
            hasSeenGuide: true
        });

        revalidatePath('/contributor');
        return { success: true };
    } catch (e) {
        return { error: 'Failed to update: ' + e.message };
    }
}
