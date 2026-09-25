import { Loader2 } from 'lucide-react';

/**
 * Root-level loading UI — Next.js shows this automatically while a route
 * segment is loading, in place of the whole page (this sits above the
 * dashboard layout too, so there's no header/footer alongside it here).
 *
 * Matches the `Loader2` + "Loading..." pattern already used everywhere else
 * in the app (panels, page guard, buttons), just sized up for a full page.
 */
export default function Loading() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-white">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 size={20} className="animate-spin text-indigo-600" />
        Loading...
      </div>
    </div>
  );
}
