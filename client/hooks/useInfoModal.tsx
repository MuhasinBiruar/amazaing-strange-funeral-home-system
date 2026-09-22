import { useCallback, useRef, useState } from 'react';
import InfoModal, {
  type InfoModalOptions,
} from '@/components/modals/infoModal';

export function useInfoModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [opts, setOpts] = useState<InfoModalOptions>({
    title: '',
    message: '',
  });

  const resolverRef = useRef<(confirmed: boolean) => void>(null);

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
