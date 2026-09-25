import { useEffect, useState } from 'react';

export const PANEL_TRANSITION_MS = 300 as const;

/**
 * Manages a `SidePanel`'s open/close transition.
 *
 * Mount the panel only when there's something to show - `shown` flips to `true`
 * a frame later so the enter transition actually plays (a freshly mounted
 * element has no previous style to transition from). `requestClose` plays the
 * exit transition, then calls `onClose` - typically what the parent uses to
 * unmount the panel.
 */
export function useSidePanel(onClose: () => void) {
  const [isShown, setIsShown] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsShown(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  function requestClose() {
    setIsShown(false);
    setTimeout(onClose, PANEL_TRANSITION_MS);
  }

  return { isShown, requestClose };
}
