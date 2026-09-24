export default function CreatedCredentials({
  username,
  password,
  onDone,
}: {
  username: string;
  password: string;
  onDone: () => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-700">
        Account created. Share these credentials with the new staff member:
      </p>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm space-y-1">
        <div>
          Username: <span className="font-semibold">{username}</span>
        </div>
        <div>
          Password: <span className="font-semibold">{password}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={onDone}
        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition cursor-pointer"
      >
        Done
      </button>
    </div>
  );
}
