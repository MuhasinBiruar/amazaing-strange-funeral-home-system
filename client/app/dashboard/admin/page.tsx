'use client';
import { useRouter } from 'next/navigation';
import { getAllStaff, type StaffMember } from '@/services/staffService';
import { useState, useEffect } from 'react';
import type { CreateStaffQuery } from 'shared';
/**
 * @todo do not allow access to edit button if user has not selected a staff member to edit.
 * Do not allow regular staff to access this page, only admin users should be able to access this page.
 *
 *
 */

export default function AdminPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const staffData = await getAllStaff();
        setStaff(staffData);
      } catch (error) {
        console.error('Error fetching staff data:', error);
        setStaff([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 space-y-6 border border-gray-200">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <p className="text-lg font-medium">Admin Actions</p>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => router.push('/dashboard/create-account')}
              className="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition hover:cursor-pointer"
            >
              Create Account
            </button>
            <button className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition hover:cursor-pointer">
              Edit Account
            </button>
          </div>
        </div>
        {/* display staff here */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-lg font-medium mb-4">Staff List</p>
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Last Name</th>
                <th className="px-4 py-3">First Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Job Role</th>
                <th className="px-4 py-3">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {staff.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {user.lastName}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{user.firstName}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{user.jobRole}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        user.isActive ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                      title={user.isActive ? 'Active' : 'Inactive'}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
