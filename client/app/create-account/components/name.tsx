"use client";

const NameInput = () => {
  return (
    <>
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          FIRST NAME
        </label>
        <input
          name="firstName"
          type="text"
          className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="First Name"
          required
        />
      </div>
      <div className="relative">
        <label className="block text-xs font-semibold text-gray-700 mb-1 mt-5">
          MIDDLE NAME
        </label>
        <span className="text-gray-400 text-xs">Optional</span>
        <input
          name="middleName"
          type="text"
          className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Middle Name"
        />
      </div>
      <div className="relative">
        <label className="block text-xs font-semibold text-gray-700 mb-1 mt-5">
          LAST NAME
        </label>
        <input
          name="lastName"
          type="text"
          className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Last Name"
          required
        />
      </div>
    </>
  );
};

export default NameInput;
