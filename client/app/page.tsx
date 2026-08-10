'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Handle login logic
    console.log('Login attempt:', { email, password });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold mb-6 text-[#00236F]">Login</h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <p id="email-help" className="mt-1 text-sm text-gray-500">
              Type your email here
            </p>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              aria-describedby="email-help"
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <p id="password-help" className="mt-1 text-sm text-gray-500">
              Type your password here
            </p>
            <div className="relative mt-1">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="off"
                value={password}
                aria-describedby="password-help"
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${password ? 'pr-20' : 'pr-3'}`}
                required
              />
              {password && (
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute inset-y-0 right-0 px-3 text-sm font-medium text-[#00236F] hover:text-blue-700 hover:cursor-pointer"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#00236F] text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 transition hover:cursor-pointer"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
