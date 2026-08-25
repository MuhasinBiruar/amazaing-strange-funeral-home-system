'use client';

import { useState, useEffect } from 'react';
import { authClient } from './lib/auth-client';
import { useRouter } from 'next/navigation';
import AlreadyLoggedInModal from './components/modal/already-logged-in';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const [welcomeUser, setWelcomeUser] = useState<{
    firstName: string;
    lastName: string;
    jobRole: string;
  } | null>(null);
  const [isAlreadyLoggedIn, setIsAlreadyLoggedIn] = useState(false);

  useEffect(() => {
    authClient.getSession().then(({ data }) => {
      if (data) {
        setUsername(data.user?.username ?? '');
        setIsAlreadyLoggedIn(true);
      }
    });
  }, []);

  /**
   * Handles the login form submission. Signs in via username/password,
   * sets an error message on failure, or populates `welcomeUser` on
   * success to trigger the welcome modal (redirect to dashboard happens
   * when the user proceeds from the modal).
   *
   * @param e - The form submit event.
   */
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    await authClient.signIn
      .username({ username, password })
      .then((response) => {
        console.log('Login Info:', response);
        if (response.error) {
          setError(response.error.message ?? 'log in failed, please try again');
          return;
        } else {
          //show welcome message to user and redirect to dashboard after clicking ok button
          const user = response.data.user as typeof response.data.user & {
            firstName?: string;
            lastName?: string;
            jobRole?: string;
          };
          setError('');
          setWelcomeUser({
            firstName: user.firstName ?? '',
            lastName: user.lastName ?? '',
            jobRole: user.jobRole?.toUpperCase() ?? '',
          });
        }
      });
  }

  async function handleLogOut() {
    setWelcomeUser(null);
    await authClient.signOut().then(() => {
      setIsAlreadyLoggedIn(false);
      setUsername('');
      setPassword('');
    });
  }

  /**
   * Dismisses the welcome modal and signs the user back out, reverting
   * the just-completed login rather than proceeding to the dashboard.
   *
   * @param e - The button click event.
   */

  async function handleCancel(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    setWelcomeUser(null);
    await authClient.signOut().then((response) => {
      console.log('Sign out Info:', response);
    });
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold mb-6 text-[#00236F]">Login</h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700"
            >
              Username
            </label>
            <p id="username-help" className="mt-1 text-sm text-gray-500">
              Type your username here
            </p>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              aria-describedby="username-help"
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <span className="text-red-500 text-sm">{error}</span>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
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
      {welcomeUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 bg-opacity-50 min-h-screen w-full">
          <div className="bg-white p-10 rounded-lg shadow-md text-center border-black shadow-black">
            <h2 className="text-4xl text-[#00236F] font-bold mb-4">
              Welcome, {welcomeUser.firstName} {welcomeUser.lastName}
            </h2>
            <h3 className="text-2xl text-[#3a67c8] font-semibold mb-2">
              {welcomeUser.jobRole}
            </h3>
            <p className="mb-4 text-gray-600 text-md">
              You have successfully logged in.
            </p>
            <button
              onClick={handleCancel}
              className="bg-gray-300 text-gray-800 py-4 px-8 rounded-md font-medium hover:bg-gray-400 transition hover:cursor-pointer mr-2"
            >
              Cancel
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-[#00236F] text-white py-4 px-8 rounded-md font-medium hover:bg-blue-700 transition hover:cursor-pointer"
            >
              Proceed
            </button>
          </div>
        </div>
      )}
      {isAlreadyLoggedIn && (
        <AlreadyLoggedInModal username={username} handleLogOut={handleLogOut} />
      )}
    </div>
  );
}
