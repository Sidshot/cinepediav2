
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import dbConnect from "./mongodb"
import User from "@/models/User"

export const { handlers, signIn, signOut, auth } = NextAuth({
    secret: process.env.AUTH_SECRET,
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account.provider === "google") {
                await dbConnect();
                try {
                    const existingUser = await User.findOne({ email: user.email });
                    if (!existingUser) {
                        await User.create({
                            name: user.name,
                            email: user.email,
                            image: user.image,
                            role: 'user', // Default role
                        });
                    }
                    return true;
                } catch (error) {
                    console.error("Error saving user:", error);
                    return false;
                }
            }
            return true;
        },
        async session({ session, token }) {
            // Attach role to session from DB
            await dbConnect();
            const dbUser = await User.findOne({ email: session.user.email }).lean();
            if (dbUser) {
                session.user.id = dbUser._id.toString();
                session.user.role = dbUser.role;
                session.user.isAdmin = isAdmin(dbUser.email);
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
            }
            return token;
        }
    },
    pages: {
        signIn: '/login', // Custom login page if needed
    }
})

// Helper to check admin status
function isAdmin(email) {
    const admins = (process.env.ADMIN_EMAILS || '').split(',');
    return admins.includes(email);
}
