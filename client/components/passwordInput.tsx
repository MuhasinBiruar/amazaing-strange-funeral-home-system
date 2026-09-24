'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type'
> {
  className?: string;
}

const defaultClassName = `
  w-full text-sm border border-gray-200 rounded-md 
  px-2.5 py-1.5 text-gray-700 
  focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400
` as const;

/**
 * A password `<input>` with a toggleable 'eye' icon on the right for
 * showing/hiding the value.
 */
export default function PasswordInput({
  className = defaultClassName,
  ...rest
}: PasswordInputProps) {
  const [isShown, setIsShown] = useState(false);

  return (
    <div className="relative">
      <input
        {...rest}
        type={isShown ? 'text' : 'password'}
        className={`${className} pr-9`}
      />
      <button
        type="button"
        onClick={() => setIsShown((prev) => !prev)}
        aria-label={isShown ? 'Hide password' : 'Show password'}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
      >
        {isShown ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
