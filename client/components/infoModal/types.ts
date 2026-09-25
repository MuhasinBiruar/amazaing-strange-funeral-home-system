import { type LucideIcon } from 'lucide-react';

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
  /**
   * Which button, if any, is currently running its async action. While set,
   * both buttons (and the X) are disabled and the active one shows a
   * spinner in place of its label. Managed internally by `useInfoModal`.
   */
  loadingButton?: 'confirm' | 'close' | null;
}

export type InfoModalOptions = Omit<
  InfoModalProps,
  ['onClose', 'onConfirm', 'loadingButton'][number]
> & {
  /**
   * Async work to run when the confirm button is clicked, before the modal
   * closes and `showInfo`'s promise resolves. While it runs, both buttons
   * disable and the confirm button shows a spinner. If it throws, the modal
   * stays open (error logged to console) so the user can retry or cancel.
   */
  onConfirmAction?: () => void | Promise<void>;
  /** Same as {@link onConfirmAction}, but for the close/cancel button. */
  onCloseAction?: () => void | Promise<void>;
};
