import { Loader2, type LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';

interface LoadingButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  /**Whether the button's action is currently running. */
  isLoading: boolean;
  /** Label shown while idle. */
  label: string;
  /** Label shown while `isLoading` is true. Defaults to `label`. */
  loadingLabel?: string;
  /** Icon shown next to the label while idle (swapped for a spinner while loading). */
  icon?: LucideIcon;
  iconSize?: number;
}

/**
 * A button that swaps its icon/label for a spinner while an async action is
 * in progress (`isLoading`), then reverts to the normal label once it's done.
 *
 * @example
 * <LoadingButton
 *   type="submit"
 *   isLoading={isSigningIn}
 *   label="Sign In"
 *   loadingLabel="Signing In..."
 *   className="w-full bg-[#00236F] text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed hover:cursor-pointer"
 * />
 */
export default function LoadingButton({
  isLoading,
  label,
  loadingLabel,
  icon: Icon,
  iconSize = 14,
  disabled,
  ...rest
}: LoadingButtonProps) {
  return (
    <button {...rest} disabled={isLoading || disabled}>
      <span className="flex items-center justify-center gap-1.5">
        {isLoading ? (
          <Loader2 size={iconSize} className="animate-spin" />
        ) : (
          Icon && <Icon size={iconSize} />
        )}
        {isLoading ? (loadingLabel ?? label) : label}
      </span>
    </button>
  );
}
