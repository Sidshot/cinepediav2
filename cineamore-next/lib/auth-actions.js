'use server';

import { signIn, signOut } from "@/lib/auth-next";

export async function handleSignIn() {
    await signIn("google");
}

export async function handleSignOut() {
    await signOut();
}
