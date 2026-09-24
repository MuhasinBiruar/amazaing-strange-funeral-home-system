'use client';

import { useState, useEffect } from 'react';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useInfoModal } from '@/hooks/useInfoModal';
import LoadingButton from '@/components/loadingButton';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordShown, setIsPasswordShown] = useState(false);
  const [error, setError] = useState('');

  const { infoModal, showInfo } = useInfoModal();

  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  /**
   * Checks for an existing session once, on mount, and if one exists, asks the
   * user whether to log out of it before continuing.
   */
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await authClient.getSession();

        if (!data) return;

        const isConfirmed = await showInfo({
          title: 'Already Logged In',
          message: (
            <>
              <div className="mb-4">
                You are already logged in as:{' '}
                <span className="text-base text-indigo-600 font-semibold">
                  {data.user?.username ?? ''}
                </span>
              </div>
              <p className="text-gray-600">
                Please log out first before logging in as someone else.
              </p>
            </>
          ),
          closeLabel: 'Cancel',
          confirmLabel: 'Log Out',
          onConfirmAction: async () => {
            await authClient.signOut();
          },
          severity: 'warning',
        });

        if (isConfirmed) return;

        router.push('/dashboard');
      } catch (err) {
        console.error('Failed to check session:', err);
        setError('Unable to check login status. Please refresh.');
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();
    // Intentionally runs once on mount only, read:
    // Previously this depended on `[router, showInfo, username]`, which meant
    // it re-ran on every keystroke in the username field (not just once), and
    // nothing stopped the user from submitting the login form while this
    // check was still pending.
    //
    // That let both modals fire: this effect's
    // "Already Logged In" warning, followed by `handleLogin`'s "Welcome"
    // modal from a login that raced ahead of it. Running this once, and
    // gating the Sign In button on `isCheckingSession` below, closes that gap.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Handles the login form submission. Signs in via username/password,
   * sets an error message on failure, or opens the welcome `InfoModal` on
   * success and redirects after confirmation.
   *
   * @param e - The form submit event.
   */
  async function handleLogin(e: React.SubmitEvent) {
    e.preventDefault();

    // Prevent an Enter-key implicit submit to slip through.
    if (isCheckingSession || isSigningIn) return;

    setIsSigningIn(true);
    let result: Awaited<ReturnType<typeof authClient.signIn.username>>;
    try {
      result = await authClient.signIn.username({ username, password });
    } finally {
      // Only the network call itself is "signing in" — the modal below
      // manages its own loading state independently.
      setIsSigningIn(false);
    }

    console.log('Login info:', result);

    const { data, error } = result;
    if (error) {
      setError(error.message ?? 'Login failed, please try again.');
      return;
    }

    // Show welcome message to user and redirect to dashboard
    const user = data.user as typeof data.user & {
      firstName?: string;
      lastName?: string;
      jobRole?: string;
    };

    setError('');

    const isConfirmed = await showInfo({
      title: `Welcome`,
      message: (
        <div className="text-center">
          <p className="text-base">
            Welcome,{' '}
            <span className="font-semibold text-indigo-600">
              {user.firstName ?? ''} {user.lastName ?? ''}
            </span>
            !
          </p>

          <p className="mt-2 text-sm text-gray-500">
            You have successfully logged in as{' '}
            <span className="font-medium">
              {user.jobRole?.toUpperCase() ?? ''}
            </span>
            .
          </p>
        </div>
      ),
      closeLabel: 'Cancel',
      onCloseAction: async () => {
        const res = await authClient.signOut();
        console.log('Sign out Info:', res);
      },
      confirmLabel: 'Proceed',
      severity: 'success',
    });

    if (!isConfirmed) return;

    router.push('/dashboard');
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold mb-6 text-indigo-600">Login</h1>

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
                type={isPasswordShown ? 'text' : 'password'}
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
                  onClick={() => setIsPasswordShown((visible) => !visible)}
                  className="absolute inset-y-0 right-0 px-3 text-sm font-medium text-[#00236F] hover:text-blue-700 hover:cursor-pointer"
                >
                  {isPasswordShown ? 'Hide' : 'Show'}
                </button>
              )}
            </div>
          </div>

          <LoadingButton
            type="submit"
            isLoading={isSigningIn}
            disabled={isCheckingSession}
            label="Sign In"
            loadingLabel="Signing In..."
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed hover:cursor-pointer"
          />
        </form>
      </div>

      {infoModal}
    </div>
  );
}
