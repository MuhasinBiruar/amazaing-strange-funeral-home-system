"use client";

const ContactNumberInput = () => {
  return (
    <>
      <div className="relative">
        <label className="block text-xs font-semibold text-gray-700 mb-1 mt-5">
          Contact Number
        </label>
        <span className="text-gray-400 text-xs">Optional</span>
        <input
          name="contactNumber"
          type="tel"
          className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="09123456789"
        />
      </div>
    </>
  );
};

export default ContactNumberInput;
