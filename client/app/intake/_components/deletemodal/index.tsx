import { AlertCircle, X, FileText } from "lucide-react";

interface DeleteModalProps {
  filesToDelete: string[];
  setIsDeleteModalOpen: (isOpen: boolean) => void;
}

export default function DeleteModal({ filesToDelete, setIsDeleteModalOpen }: DeleteModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3 text-red-600">
            <AlertCircle size={24} />
            <h3 className="text-lg font-bold text-gray-900">Are you sure?</h3>
          </div>
          <button 
            onClick={() => setIsDeleteModalOpen(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>
        
        <p className="text-sm text-gray-600">
          The following files will be moved to the trash. They will be permanently deleted after 30 days.
        </p>

        <ul className="bg-red-50 text-red-800 text-sm p-3 rounded-lg border border-red-100">
          {filesToDelete.map((file, i) => (
            <li key={i} className="flex items-center gap-2 font-medium">
              <FileText size={14} /> {file}
            </li>
          ))}
        </ul>

        <div className="flex gap-3 mt-6">
          <button 
            onClick={() => setIsDeleteModalOpen(false)}
            className="flex-1 py-2 text-sm font-bold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button className="flex-1 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition">
            Delete File
          </button>
        </div>
      </div>
    </div>
  );
}