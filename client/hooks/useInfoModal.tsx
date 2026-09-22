import { useCallback, useRef, useState } from 'react';
import InfoModal, {
  type InfoModalOptions,
} from '@/components/modals/infoModal';

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

  const resolverRef = useRef<(confirmed: boolean) => void>(null);

  /**
   * Opens the info modal.
   *
   * @param options The title, message, and other modal settings.
   * @returns A promise that resolves to true if confirmed, or false if closed.
   *
   * @example
   * const confirmed = await showInfo({
   *   title: 'Information',
   *   message: 'Your changes have been saved.',
   * });
   */
  const showInfo = useCallback((options: InfoModalOptions) => {
    setOpts(options);
    setIsOpen(true);

    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    resolverRef.current?.(false);
    resolverRef.current = null;
  }, []);

  const confirm = useCallback(() => {
    setIsOpen(false);
    resolverRef.current?.(true);
    resolverRef.current = null;
  }, []);

  const infoModal = isOpen ? (
    <InfoModal {...opts} onClose={close} onConfirm={confirm} />
  ) : null;

  return {
    infoModal,
    showInfo,
  };
}
