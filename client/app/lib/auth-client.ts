import { createAuthClient } from "better-auth/client";
import { usernameClient, adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_API_URL, // e.g. http://localhost:4000
    plugins: [usernameClient(), adminClient()],
});