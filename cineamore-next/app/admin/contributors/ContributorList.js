'use client';

import { useState } from 'react';
import { createContributor, updateContributor, deleteContributor } from '@/lib/contributorManagement';

export default function ContributorList({ contributors: initialContributors }) {
    const [contributors, setContributors] = useState(initialContributors);
    const [showCreate, setShowCreate] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [showPasswordId, setShowPasswordId] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Form state
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newDisplayName, setNewDisplayName] = useState('');

    const handleCreate = async (e) => {
        e.preventDefault();
        setError(null);

        const formData = new FormData();
        formData.set('username', newUsername);
        formData.set('password', newPassword);
        formData.set('displayName', newDisplayName);

        const result = await createContributor(formData);

        if (result.error) {
            setError(result.error);
        } else {
            setSuccess('Contributor created successfully!');
            setShowCreate(false);
            setNewUsername('');
            setNewPassword('');
            setNewDisplayName('');
            // Refresh page to get updated list
            window.location.reload();
        }
    };

    const handleUpdate = async (id, formData) => {
        setError(null);
        const result = await updateContributor(id, formData);

        if (result.error) {
            setError(result.error);
        } else {
            setSuccess('Contributor updated!');
            setEditingId(null);
            window.location.reload();
        }
    };

    const handleDelete = async (id, username) => {
        if (!confirm(`Delete contributor "${username}"? This cannot be undone.`)) return;

        const result = await deleteContributor(id);

        if (result.error) {
            setError(result.error);
        } else {
            setContributors(contributors.filter(c => c._id !== id));
            setSuccess('Contributor deleted.');
        }
    };

    const toggleActive = async (id, currentActive) => {
        const formData = new FormData();
        formData.set('isActive', (!currentActive).toString());
        await handleUpdate(id, formData);
    };

    return (
        <div className="space-y-6">
            {/* Alerts */}
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                    {error}
                    <button onClick={() => setError(null)} className="ml-4 text-sm underline">Dismiss</button>
                </div>
            )}
            {success && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400">
                    {success}
                    <button onClick={() => setSuccess(null)} className="ml-4 text-sm underline">Dismiss</button>
                </div>
            )}

            {/* Create Button */}
            <div className="flex justify-end">
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="px-6 py-3 bg-[var(--accent)] text-[var(--bg)] font-bold rounded-xl hover:brightness-110 transition"
                >
                    + Add Contributor
                </button>
            </div>

            {/* Create Form */}
            {showCreate && (
                <form onSubmit={handleCreate} className="bg-[var(--card-bg)] p-6 rounded-2xl border border-[var(--border)] space-y-4">
                    <h3 className="text-lg font-bold text-[var(--fg)]">Create New Contributor</h3>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs uppercase text-[var(--muted)] font-bold mb-2">Username</label>
                            <input
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                                placeholder="e.g. john"
                                required
                                minLength={3}
                                className="w-full h-10 px-4 rounded-lg bg-black/20 border border-[var(--border)] text-[var(--fg)]"
                            />
                        </div>
                        <div>
                            <label className="block text-xs uppercase text-[var(--muted)] font-bold mb-2">Password</label>
                            <input
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Min 4 characters"
                                required
                                minLength={4}
                                className="w-full h-10 px-4 rounded-lg bg-black/20 border border-[var(--border)] text-[var(--fg)]"
                            />
                        </div>
                        <div>
                            <label className="block text-xs uppercase text-[var(--muted)] font-bold mb-2">Display Name</label>
                            <input
                                value={newDisplayName}
                                onChange={(e) => setNewDisplayName(e.target.value)}
                                placeholder="Optional"
                                className="w-full h-10 px-4 rounded-lg bg-black/20 border border-[var(--border)] text-[var(--fg)]"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end">
                        <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 bg-white/5 rounded-lg text-[var(--muted)]">
                            Cancel
                        </button>
                        <button type="submit" className="px-6 py-2 bg-green-500 text-white font-bold rounded-lg hover:brightness-110">
                            Create
                        </button>
                    </div>
                </form>
            )}

            {/* Contributors Table */}
            <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-black/20 text-[var(--muted)] text-xs uppercase tracking-wider">
                        <tr>
                            <th className="p-4 font-bold">Username</th>
                            <th className="p-4 font-bold hidden md:table-cell">Display Name</th>
                            <th className="p-4 font-bold hidden md:table-cell">Password</th>
                            <th className="p-4 font-bold">Status</th>
                            <th className="p-4 font-bold text-center">Pending</th>
                            <th className="p-4 font-bold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                        {contributors.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="p-8 text-center text-[var(--muted)]">
                                    No contributors yet. Create one to get started.
                                </td>
                            </tr>
                        ) : (
                            contributors.map(c => (
                                <tr key={c._id} className="hover:bg-white/5 transition">
                                    <td className="p-4">
                                        <span className="font-bold text-[var(--fg)]">@{c.username}</span>
                                    </td>
                                    <td className="p-4 hidden md:table-cell text-[var(--muted)]">
                                        {c.displayName || '—'}
                                    </td>
                                    <td className="p-4 hidden md:table-cell">
                                        {showPasswordId === c._id ? (
                                            <span className="font-mono text-[var(--accent)]">{c.password}</span>
                                        ) : (
                                            <button
                                                onClick={() => setShowPasswordId(showPasswordId === c._id ? null : c._id)}
                                                className="text-xs text-[var(--muted)] hover:text-[var(--fg)] underline"
                                            >
                                                Show
                                            </button>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => toggleActive(c._id, c.isActive)}
                                            className={`px-3 py-1 rounded-full text-xs font-bold ${c.isActive
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-red-500/20 text-red-400'
                                                }`}
                                        >
                                            {c.isActive ? 'Active' : 'Inactive'}
                                        </button>
                                    </td>
                                    <td className="p-4 text-center">
                                        {c.pendingCount > 0 ? (
                                            <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs font-bold">
                                                {c.pendingCount}
                                            </span>
                                        ) : (
                                            <span className="text-[var(--muted)]">0</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right space-x-3">
                                        <button
                                            onClick={() => setShowPasswordId(showPasswordId === c._id ? null : c._id)}
                                            className="text-sm text-blue-400 hover:underline md:hidden"
                                        >
                                            {showPasswordId === c._id ? 'Hide' : 'Show'} PW
                                        </button>
                                        <button
                                            onClick={() => handleDelete(c._id, c.username)}
                                            className="text-sm text-red-500 hover:underline"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
