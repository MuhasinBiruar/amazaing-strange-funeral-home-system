import { createAuthClient } from 'better-auth/react';
import { usernameClient, adminClient } from 'better-auth/client/plugins';

/**
 * Better Auth client instance for the Next.js frontend.
 */
export const authClient = createAuthClient({
  baseURL: `${process.env.NEXT_PUBLIC_APP_URL}/api/backend/api/auth`,
  plugins: [usernameClient(), adminClient()],
});
