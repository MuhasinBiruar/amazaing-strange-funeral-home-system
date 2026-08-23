"use client";

import { useState } from "react";

const PasswordInput = () => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <label
        htmlFor="password"
        className="block text-xs font-semibold text-gray-700 mb-1 mt-5"
      >
        PASSWORD
      </label>
      <input
        id="password"
        type={showPassword ? "text" : "password"}
        autoComplete="off"
        name="password"
        value={password}
        aria-describedby="password-help"
        onChange={(e) => setPassword(e.target.value)}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
          password ? "pr-20" : "pr-3"
        }`}
        required
      />
      {password && (
        <button
          type="button"
          onClick={() => setShowPassword((visible) => !visible)}
          className="absolute inset-y-0 right-0 px-3 text-sm font-medium text-[#00236F] hover:text-blue-700 hover:cursor-pointer mt-5"
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      )}
    </div>
  );
};

export default PasswordInput;
