'use client';
import { useRouter } from 'next/navigation';

const AlreadyLoggedInModal = ({
  username,
  handleLogOut,
}: {
  username: string;
  handleLogOut: () => void;
}) => {
  const router = useRouter();
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 bg-opacity-50 min-h-screen w-full">
      <div className="bg-white p-10 rounded-lg shadow-md text-center border-black shadow-black">
        <h2 className="text-4xl text-[#00236F] font-bold mb-4">Attention</h2>
        <h3 className="text-2xl text-[#3a67c8] font-semibold mb-2">
          You are already logged in as:
        </h3>
        <p className="mb-4 text-gray-600 text-md">
          username: <b>{username}</b>
        </p>
        <p className="mb-4 text-gray-600 text-md">
          Please log out first before logging in as someone else
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="bg-gray-300 text-gray-800 py-4 px-8 rounded-md font-medium hover:bg-gray-400 transition hover:cursor-pointer mr-2"
        >
          Cancel
        </button>
        <button
          onClick={handleLogOut}
          className="bg-[#00236F] text-white py-4 px-8 rounded-md font-medium hover:bg-blue-700 transition hover:cursor-pointer"
        >
          Log Out
        </button>
      </div>
    </div>
  );
};

export default AlreadyLoggedInModal;
