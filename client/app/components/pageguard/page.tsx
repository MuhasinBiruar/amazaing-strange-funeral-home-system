"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "../../lib/auth-client";

/**
 * Client-side route guard that verifies the current user has an active
* session before rendering its children.
*
* On mount, checks the session via `authClient.getSession()`. While the check is in flight, renders a loading state. If no valid session is
* found (or the check errors), redirects to `/` (login page). Only once a session is confirmed does it render `children` (the current protected page).
*
* This is a UX convenience, not a security boundary — it runs entirely in the browser after the page has already loaded. Every protected
* server endpoint must independently verify the session; this guard only prevents the UI from flashing protected content to signed-out users and nudges them back to login.
*
* @remarks
* Wrap any page that should require authentication:
* ```tsx
* export default function DashboardPage() {
*   return (
*     <PageGuard>
*       <DashboardContent />
*     </PageGuard>
*   );
* }
* ```
*
* @todo Create a modal informing the user they are not logged in
* (e.g. "You must be logged in to view this page") before routing
* back to the login page, instead of redirecting silently.
*
* @param children - The protected content to render once a session is confirmed.
* @returns A loading indicator while checking, `null` if unauthorized
* (briefly, before redirect), or `children` once authorized.
*/

export default function PageGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let loggedOut = false;

    authClient.getSession().then(({ data, error }) => {
      if (loggedOut) return;

      if (!data || error) {
        router.push("/");
      } else {
        setAuthorized(true);
      }
      setChecking(false);
    });

    return () => {
      loggedOut = true;
    };
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}