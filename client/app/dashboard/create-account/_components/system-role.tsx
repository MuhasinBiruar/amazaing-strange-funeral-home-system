'use client';

interface SystemRoleInputProps {
  role: 'admin' | 'user';
  onRoleChange: (role: 'admin' | 'user') => void;
}

const SystemRoleInput = ({ role, onRoleChange }: SystemRoleInputProps) => {
  return (
    <div className="relative">
      <label className="block text-xs font-semibold text-gray-700 mb-1 mt-5">
        System Role
      </label>
      <span className="text-gray-400 text-xs">
        User: Restricted Access | Admin: Full Access (Defaulted to User ; Role
        in this System)
      </span>
      <div className="grid grid-cols-2 gap-2">
        {(['user', 'admin'] as const).map((rol) => (
          <button
            type="button"
            key={rol}
            onClick={() => onRoleChange(rol)}
            className={`py-2 px-1 text-xs sm:text-sm font-medium rounded-lg border transition ${
              role === rol
                ? 'bg-indigo-900 text-white border-indigo-900 hover:cursor-pointer'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:cursor-pointer'
            }`}
          >
            {rol}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SystemRoleInput;
