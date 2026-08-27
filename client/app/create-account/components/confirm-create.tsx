'use client';

import { Staff } from 'shared';

interface ConfirmCreateModalProps {
  staffData: Staff;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const ConfirmCreateModal = ({
  staffData,
  isSubmitting,
  onCancel,
  onConfirm,
}: ConfirmCreateModalProps) => {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-6 space-y-4">
        <h3 className="text-lg font-bold text-gray-900">
          Confirm Account Creation
        </h3>
        <p className="text-sm text-gray-600">
          Create an account for{' '}
          <span className="font-semibold">
            {staffData.firstName} {staffData.lastName}
          </span>{' '}
          with the system role{' '}
          <span className="font-semibold">{staffData.role}</span>?
        </p>

        <p className="text-sm text-gray-600">
          Note:{' '}
          <span className="font-semibold">
            Username will be created automatically after confirmation.
          </span>
        </p>

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 hover:cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 hover:cursor-pointer"
          >
            {isSubmitting ? 'Creating...' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmCreateModal;
