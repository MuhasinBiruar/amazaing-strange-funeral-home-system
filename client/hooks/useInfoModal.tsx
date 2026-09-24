import { useCallback, useRef, useState } from 'react';
import InfoModal, {
  type InfoModalOptions,
} from '@/components/modals/infoModal';
import { createPortal } from 'react-dom';

type LoadingButton = 'confirm' | 'close' | null;

/**
 * Provides an info modal and a function to open it.
 *
 * @returns The info modal element and the `showInfo` function.
 */
export function useInfoModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [opts, setOpts] = useState<InfoModalOptions>({
    title: '',
    message: '',
  });
  const [loadingButton, setLoadingButton] = useState<LoadingButton>(null);

  const resolverRef = useRef<(confirmed: boolean) => void>(null);

  /**
   * Opens the info modal.
   *
   * @param options If `onConfirmAction`/`onCloseAction` are given, clicking
   * that button runs the action first: both buttons disable, the clicked one
   * shows a spinner, and the modal stays open (and `showInfo`'s promise stays
   * pending) until the action settles. If the action throws, the modal stays
   * open so the user can retry or cancel.
   * @returns A promise that resolves to true if confirmed, or false if closed.
   *
   * @example
   * const confirmed = await showInfo({
   *   title: 'Information',
   *   message: 'Your changes have been saved.',
   * });
   *
   * @example
   * // Delayed close while an async action runs:
   * await showInfo({
   *   title: 'Log Out?',
   *   message: 'Are you sure you want to log out?',
   *   closeLabel: 'Cancel',
   *   confirmLabel: 'Log Out',
   *   severity: 'warning',
   *   onConfirmAction: () =>
   *     new Promise<void>((resolve) => {
   *       authClient.signOut({
   *         fetchOptions: {
   *           onSuccess: () => { router.push('/'); resolve(); },
   *           onError: () => resolve(),
   *         },
   *       });
   *     }),
   * });
   */
  const showInfo = useCallback((options: InfoModalOptions) => {
    setOpts(options);
    setLoadingButton(null);
    setIsOpen(true);

    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const close = useCallback(async () => {
    if (opts.onCloseAction) {
      setLoadingButton('close');

      try {
        await opts.onCloseAction();
      } catch (error) {
        console.error('InfoModal close action failed:', error);
        setLoadingButton(null);
        return; // Keep the modal open so the user can retry/cancel.
      }
    }

    setIsOpen(false);
    setLoadingButton(null);
    resolverRef.current?.(false);
    resolverRef.current = null;
  }, [opts]);

  const confirm = useCallback(async () => {
    if (opts.onConfirmAction) {
      setLoadingButton('confirm');

      try {
        await opts.onConfirmAction();
      } catch (error) {
        console.error('InfoModal confirm action failed:', error);
        setLoadingButton(null);
        return; // Keep the modal open so the user can retry/cancel.
      }
    }

    setIsOpen(false);
    setLoadingButton(null);
    resolverRef.current?.(true);
    resolverRef.current = null;
  }, [opts]);

  const infoModal = isOpen
    ? createPortal(
        <InfoModal
          {...opts}
          onClose={close}
          onConfirm={confirm}
          loadingButton={loadingButton}
        />,
        document.body,
      )
    : null;

  return {
    infoModal,
    showInfo,
  };
}
