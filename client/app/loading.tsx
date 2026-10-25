import { Loader2 } from 'lucide-react';

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
