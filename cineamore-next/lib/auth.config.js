export const authConfig = {
    pages: {
        signIn: '/login',
    },
    providers: [], // Keep empty for middleware to be lightweight
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnAdmin = nextUrl.pathname.startsWith('/admin');

            if (isOnAdmin) {
                if (isLoggedIn) return true;
                return false; // Redirect to login
            }
            return true;
        },
    },
}
