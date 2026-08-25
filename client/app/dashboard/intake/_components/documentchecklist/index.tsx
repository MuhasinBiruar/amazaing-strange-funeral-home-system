import { Upload, Trash2, CheckCircle2 } from "lucide-react";

interface DocumentChecklistProps {
  documentProgress: number;
  setIsDeleteModalOpen: (isOpen: boolean) => void;
}

export default function DocumentChecklist({
  documentProgress,
  setIsDeleteModalOpen,
}: DocumentChecklistProps) {
  return (
    <section className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900">Document Checklist</h2>
        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">
          4 REQUIRED
        </span>
      </div>

      <div className="space-y-3">
        {/* Sample Completed Document */}
        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-indigo-900" size={20} />
            <span className="text-sm font-medium text-gray-900">
              Death Certificate
            </span>
          </div>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="text-gray-400 hover:text-red-500 transition"
          >
            <Trash2 size={16} />
          </button>
        </div>

        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-gray-300 rounded"></div>
            <span className="text-sm font-medium text-gray-700">
              Release Paper
            </span>
          </div>
          <button className="flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-indigo-600">
            <Upload size={14} />
            UPLOAD
          </button>
        </div>

        <p className="text-[10px] text-gray-400 text-right">
          Max file size: 2MB per document
        </p>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <div className="flex justify-between text-xs font-bold mb-1">
          <span>PROGRESS</span>
          <span>{documentProgress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-indigo-900 h-1.5 rounded-full"
            style={{ width: `${documentProgress}%` }}
          ></div>
        </div>
      </div>
    </section>
  );
}
