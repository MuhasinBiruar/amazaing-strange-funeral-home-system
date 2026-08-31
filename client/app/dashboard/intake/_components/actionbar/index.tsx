import { Save } from 'lucide-react';

interface ActionBarProps {
  clearDraft: () => void;
}

export default function ActionBar({ clearDraft }: ActionBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-gray-500">Status</span>
          <span className="text-sm font-bold text-indigo-900 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span> Draft
          </span>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={clearDraft}
            className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Discard
          </button>

          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-950 rounded-lg hover:bg-indigo-900 transition shadow-sm"
          >
            <Save size={16} />
            Save Record
          </button>
        </div>
      </div>
    </div>
  );
}
