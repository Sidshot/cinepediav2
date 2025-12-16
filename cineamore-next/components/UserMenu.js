
import { auth } from "@/lib/auth-next"
import { handleSignIn, handleSignOut } from "@/lib/auth-actions"

export default async function UserMenu() {
    const session = await auth()

    if (session?.user) {
        return (
            <div className="flex items-center gap-4">
                {session.user.image && (
                    <img
                        src={session.user.image}
                        alt={session.user.name}
                        className="w-10 h-10 rounded-full border border-[var(--border)]"
                    />
                )}
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-[var(--fg)]">{session.user.name}</span>
                    <form action={handleSignOut}>
                        <button className="text-xs text-[var(--muted)] hover:text-red-500 transition">Sign Out</button>
                    </form>
                </div>
            </div>
        )
    }

    return (
        <form action={handleSignIn}>
            <button className="bg-[var(--fg)] text-[var(--bg)] font-bold px-6 py-2 rounded-xl hover:brightness-110 transition">
                Login with Google
            </button>
        </form>
    )
}
