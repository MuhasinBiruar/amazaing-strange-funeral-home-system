import { X } from 'lucide-react';
import type { ReactNode } from 'react';

export default function SidePanel({
  shown,
  onRequestClose,
  ariaLabel,
  badge,
  badgeClassName = 'bg-indigo-100 text-indigo-800',
  title,
  subtitle,
  widthClassName = 'sm:w-md',
  children,
}: {
  shown: boolean;
  onRequestClose: () => void;
  ariaLabel: string;
  badge?: string;
  badgeClassName?: string;
  title: ReactNode;
  subtitle?: string;
  widthClassName?: string;
  children: ReactNode;
}) {
  return (
    <>
      <div
        onClick={onRequestClose}
        aria-hidden
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ${
          shown ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={`fixed inset-y-0 right-0 z-50 w-full ${widthClassName} bg-white shadow-xl border-l border-gray-200 flex flex-col transition-transform duration-300 ease-out ${
          shown ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-200 shrink-0">
          <div>
            {badge && (
              <span
                className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded mb-1.5 ${badgeClassName}`}
              >
                {badge}
              </span>
            )}
            <h2 className="text-lg font-serif font-bold text-gray-900 wrap-break-word">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onRequestClose}
            aria-label="Close panel"
            className="text-gray-400 hover:text-gray-600 cursor-pointer shrink-0"
          >
            <X size={20} />
          </button>
        </header>

        {children}
      </aside>
    </>
  );
}
