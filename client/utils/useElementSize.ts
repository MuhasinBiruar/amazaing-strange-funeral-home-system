import { useEffect, useRef, useState, type RefObject } from 'react';

/**
 * Tracks an element's rendered height via ResizeObserver.
 *
 * @returns A ref to attach and the live height (0 until mounted/measured).
 */
export default function useElementSize<T extends HTMLElement>(): [
  RefObject<T | null>,
  number,
] {
  const ref = useRef<T>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setHeight(entry.contentRect.height);
    });

    observer.observe(el);
    setHeight(el.getBoundingClientRect().height);

    return () => observer.disconnect();
  }, []);

  return [ref, height];
}
