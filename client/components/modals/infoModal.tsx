import {
  X,
  FileText,
  Info,
  TriangleAlert,
  CircleCheck,
  OctagonX,
  type LucideIcon,
} from 'lucide-react';

export interface InfoModalProps {
  title: string;
  message: React.ReactNode;
  closeLabel?: string;
  onClose: () => void;
  severity?: 'info' | 'warning' | 'error' | 'success';
  items?: string[];
  itemIcon?: LucideIcon;
  /**
   * Adds a second, primary action button (e.g. "Assign a package") alongside
   * the close button, which becomes secondary/muted. Provide both or
   * neither - missing either of them keeps the original single-button layout.
   */
  confirmLabel?: string;
  onConfirm?: () => void;
}

export type InfoModalOptions = Omit<
  InfoModalProps,
  ['onClose', 'onConfirm'][number]
>;

const severityStyles = {
  info: {
    icon: <Info size={24} />,
    iconColor: 'text-sky-600',
    list: 'bg-sky-50 text-sky-800 border-sky-100',
    button: 'bg-sky-600 hover:bg-sky-700',
  },
  warning: {
    icon: <TriangleAlert size={24} />,
    iconColor: 'text-amber-600',
    list: 'bg-amber-50 text-amber-800 border-amber-100',
    button: 'bg-amber-600 hover:bg-amber-700',
  },
  error: {
    icon: <OctagonX size={24} />,
    iconColor: 'text-red-600',
    list: 'bg-red-50 text-red-800 border-red-100',
    button: 'bg-red-600 hover:bg-red-700',
  },
  success: {
    icon: <CircleCheck size={24} />,
    iconColor: 'text-green-600',
    list: 'bg-green-50 text-green-800 border-green-100',
    button: 'bg-green-600 hover:bg-green-700',
  },
};

export default function InfoModal({
  title,
  message,
  closeLabel = 'Close',
  onClose,
  severity = 'info',
  items,
  itemIcon: ItemIcon = FileText,
  confirmLabel,
  onConfirm,
}: InfoModalProps) {
  const hasConfirmAction = Boolean(confirmLabel && onConfirm);
  const styles = severityStyles[severity];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-start">
          <div className={`flex items-center gap-3 ${styles.iconColor}`}>
            {severity === 'info' && <Info size={24} />}
            {severity === 'warning' && <TriangleAlert size={24} />}
            {severity === 'error' && <OctagonX size={24} />}
            {severity === 'success' && <CircleCheck size={24} />}
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-gray-600">{message}</p>

        {items && items.length > 0 && (
          <ul className={`text-sm p-3 rounded-lg border ${styles.list}`}>
            {items.map((item, i) => (
              <li key={i} className="flex items-center gap-2 font-medium">
                <ItemIcon size={14} /> {item}
              </li>
            ))}
          </ul>
        )}

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className={
              hasConfirmAction
                ? 'flex-1 py-2 text-sm font-bold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition'
                : `flex-1 py-2 text-sm font-bold text-white rounded-lg ${styles.button} transition`
            }
          >
            {closeLabel}
          </button>
          {hasConfirmAction && (
            <button
              type="button"
              onClick={onConfirm}
              className={`flex-1 py-2 text-sm font-bold text-white rounded-lg ${styles.button} transition`}
            >
              {confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
