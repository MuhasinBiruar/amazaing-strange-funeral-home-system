'use client';
import { useRouter } from 'next/navigation';
import { getAllStaff } from '@/services/staffService';
import { useState, useEffect } from 'react';
import type { CreateStaffQuery } from 'shared';
/**
 * @todo do not allow access to edit button if user has not selected a staff member to edit.
 * Do not allow regular staff to access this page, only admin users should be able to access this page.
 *
 *
 */

export default function AdminPage() {
  const [staff, setStaff] = useState<CreateStaffQuery[]>([]);
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header block, matches Cases page */}
        <div>
          <span className="inline-block bg-orange-100 text-orange-800 text-xs font-semibold px-2.5 py-0.5 rounded mb-2">
            ADMIN
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900">
            Staff Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage staff accounts and permissions.
          </p>
        </div>

        {/* Admin Actions card */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <p className="text-lg font-medium text-gray-900">Admin Actions</p>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <button
              onClick={() => router.push('/dashboard/create-account')}
              className="bg-indigo-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-indigo-700 transition hover:cursor-pointer"
            >
              Create Account
            </button>
            <button className="bg-green-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-green-700 transition hover:cursor-pointer">
              Edit Account
            </button>
          </div>
        </div>

        {/* Staff List card, matches the "Log" card styling */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-5 pt-5 pb-4">
            <div>
              <p className="text-lg font-semibold text-gray-900">Staff List</p>
              <p className="text-sm text-gray-400">{staff.length} members</p>
            </div>
          </div>

          <table className="w-full text-sm text-left">
            <thead className="text-gray-500 uppercase text-xs tracking-wide border-t border-b border-gray-100">
              <tr>
                <th className="px-5 py-3 font-medium">Last Name</th>
                <th className="px-5 py-3 font-medium">First Name</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Job Role</th>
                <th className="px-5 py-3 font-medium">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {staff.map((user) => (
                <tr
                  key={user.lastName + user.firstName + user.role}
                  className="hover:bg-gray-50"
                >
                  <td className="px-5 py-3 font-medium text-gray-900">
                    {user.lastName}
                  </td>
                  <td className="px-5 py-3 text-gray-700">{user.firstName}</td>
                  <td className="px-5 py-3">
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
                  <td className="px-5 py-3 text-gray-700">{user.jobRole}</td>
                  <td className="px-5 py-3">
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
