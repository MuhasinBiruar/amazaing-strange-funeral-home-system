"use client";

const RoleInput = () => {
  return (
    <>
      <div className="relative">
        <label className="block text-xs font-semibold text-gray-700 mb-1 mt-5">
          Job Role
        </label>
        <span className="text-gray-400 text-xs">
          Optional (Defaulted to Staff)
        </span>
        <input
          name="jobRole"
          type="text"
          className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="e.g., Administrator"
        />
      </div>
    </>
  );
};

export default RoleInput;
