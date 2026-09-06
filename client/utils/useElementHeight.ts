import { useCallback, useRef, useState } from 'react';

/**
 * Tracks an element's rendered height via ResizeObserver.
 *
 * @returns A callback ref (attach via `ref={...}`) rather than a ref object,
 * so measurement starts correctly even if the element mounts later than
 * the component itself (e.g. a table row that only exists once data has
 * loaded).
 */
export default function useElementHeight<T extends HTMLElement>(): [
  (node: T | null) => void,
  number,
] {
  const [height, setHeight] = useState(0);
  const observerRef = useRef<ResizeObserver | null>(null);

  const ref = useCallback((node: T | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;

    if (!node) {
      setHeight(0);
      return;
    }

    setHeight(node.getBoundingClientRect().height);

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setHeight(entry.contentRect.height);
    });

    observer.observe(node);
    observerRef.current = observer;
  }, []);

  return [ref, height];
}
