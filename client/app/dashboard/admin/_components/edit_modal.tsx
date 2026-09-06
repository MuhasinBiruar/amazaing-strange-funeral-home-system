import { useState, useEffect } from 'react';
import type { UpdateStaffQuery } from 'shared';
import { getStaff } from '@/services/staffService';
import { authClient } from '@/lib/auth-client';

export interface StaffDetails {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  password?: string;
  contactNumber: string;
  systemRole: string;
  jobRole: string;
}

// 2. Lock the fieldKey strictly to the keys of StaffDetails
interface EditableRowProps {
  label: string;
  fieldKey: keyof StaffDetails;
  value: string;
  onSave: (field: keyof StaffDetails, value: string) => void;
  type?: React.HTMLInputTypeAttribute | 'select' | 'button-group';
  options?: { label: string; value: string }[];
}

interface EditStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
}
/**
 * @todo Implement authClient.admin calls to update staff details on the server when the "Save" button is clicked
 * eg: either use authClient.admin.updateUser or manual one by one such as authClient.admin.setUserPassword or
 * use created endpoints from Backend
 *
 * @param param0
 * @returns
 */
export default function EditStaffModal({
  isOpen,
  onClose,
  username,
}: EditStaffModalProps) {
  // Placeholder state for the fetched data
  const [staffDetails, setStaffDetails] = useState({
    id: String,
    firstName: 'Loading...',
    middleName: 'Loading...',
    lastName: 'Loading...',
    email: 'Loading...',
    password: '••••••••',
    contactNumber: 'Loading...',
    systemRole: 'Loading...',
    jobRole: 'Loading...',
  });

  const handleUpdate = (field: keyof typeof staffDetails, newValue: string) => {
    // Here you will eventually add your API call to update the specific field
    setStaffDetails((prev) => ({ ...prev, [field]: newValue }));
  };

  useEffect(() => {
    const fetchStaffDetails = async () => {
      try {
        const res = await getStaff(username);
        const userData = res.data;
        setStaffDetails({
          id: userData.id,
          firstName: userData.firstName,
          middleName: userData.middleName || '',
          lastName: userData.lastName,
          email: userData.email,
          password: '••••••••', // Do not fetch the actual password
          contactNumber: userData.contactNumber || '',
          systemRole: userData.role,
          jobRole: userData.jobRole || '',
        });
        console.log('Fetched staff details:', userData);
      } catch (error) {
        console.error('Failed to fetch staff details:', error);
        // Optionally, you can set an error state here to display an error message in the UI
      }
    };
    fetchStaffDetails();
  }, [username]);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Edit Staff Profile:{' '}
            <span className="text-indigo-600">{username}</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 font-bold text-xl cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          <EditableRow
            label="First Name"
            fieldKey="firstName"
            value={staffDetails.firstName}
            onSave={handleUpdate}
          />
          <EditableRow
            label="Middle Name"
            fieldKey="middleName"
            value={staffDetails.middleName}
            onSave={handleUpdate}
          />
          <EditableRow
            label="Last Name"
            fieldKey="lastName"
            value={staffDetails.lastName}
            onSave={handleUpdate}
          />
          <EditableRow
            label="Email"
            fieldKey="email"
            value={staffDetails.email}
            onSave={handleUpdate}
            type="email"
          />
          <EditableRow
            label="Password"
            fieldKey="password"
            value={staffDetails.password}
            onSave={handleUpdate}
            type="password"
          />
          <EditableRow
            label="Contact Number"
            fieldKey="contactNumber"
            value={staffDetails.contactNumber}
            onSave={handleUpdate}
          />
          <EditableRow
            label="System Role"
            fieldKey="systemRole"
            value={staffDetails.systemRole}
            onSave={handleUpdate}
            type="button-group"
            options={[
              { label: 'Admin', value: 'admin' },
              { label: 'User', value: 'user' },
            ]}
          />
          <EditableRow
            label="Job Role"
            fieldKey="jobRole"
            value={staffDetails.jobRole}
            onSave={handleUpdate}
          />
        </div>
      </div>
    </div>
  );
}

// Reusable row component managing its own edit state
function EditableRow({
  label,
  fieldKey,
  value,
  onSave,
  type = 'text',
  options,
}: EditableRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  if (!isEditing && tempValue !== value) setTempValue(value);

  const handleSave = () => {
    onSave(fieldKey, tempValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
      <span className="text-sm font-medium text-gray-500 w-1/3">{label}</span>

      <div className="flex-1 flex items-center justify-between mt-2 sm:mt-0">
        {isEditing ? (
          type === 'button-group' && options ? (
            <div className="flex gap-2">
              {options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTempValue(opt.value)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md border transition cursor-pointer ${
                    tempValue === opt.value
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          ) : type === 'select' && options ? (
            <select
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              className="flex-1 px-3 py-1.5 text-sm border border-indigo-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              autoFocus
            >
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={type}
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              className="flex-1 px-3 py-1.5 text-sm border border-indigo-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
          )
        ) : (
          <span className="text-sm text-gray-900 truncate">
            {type === 'password' ? '••••••••' : value}
          </span>
        )}

        <div className="ml-4 flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 transition cursor-pointer"
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300 transition cursor-pointer"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs text-indigo-600 bg-indigo-50 px-3 py-1 rounded hover:bg-indigo-100 transition cursor-pointer"
            >
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
