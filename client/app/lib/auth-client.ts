import { createAuthClient } from "better-auth/react"; //changed from "better-auth/client" to "better-auth/react" to fix the error: "Module not found: Can't resolve 'better-auth/client' in 'D:\CCI-ADDU\ADDU COLLEGE\ASRP\ASRP\amazaing-strange-funeral-home-system\client\app\lib'"
import { usernameClient, adminClient } from "better-auth/client/plugins";

/**
 * Better Auth client instance for the Next.js frontend.
 *
 * Talks to the Express backend (`NEXT_PUBLIC_API_URL`) over HTTP,
 * with cookie-based sessions shared cross-origin. Configured with
 * the `username` and `admin` plugins to match the server-side setup
 * (username/password sign-in, admin-only account management).
 */
export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_API_URL, // e.g. http://localhost:4000
    plugins: [usernameClient(), adminClient()],
});