import { useEffect, useRef, useState, type RefObject } from 'react';

export default function useDynamicLimit<T extends HTMLElement>({
  rowHeight,
  chromeHeight = 0,
  outsideChromeSelector,
  minLimit = 5,
  maxLimit = 100,
  debounceDelay = 100,
}: {
  rowHeight: number;
  chromeHeight?: number;
  outsideChromeSelector?: string;
  minLimit?: number;
  maxLimit?: number;
  debounceDelay?: number;
}): [RefObject<T | null>, number] {
  const containerRef = useRef<T>(null);
  const [limit, setLimit] = useState(minLimit);

  useEffect(() => {
    function computeLimit() {
      const top = containerRef.current?.getBoundingClientRect().top ?? 0;

      const outsideChromeEl = outsideChromeSelector
        ? document.querySelector<HTMLElement>(outsideChromeSelector)
        : null;
      const outsideChromeHeight =
        outsideChromeEl?.getBoundingClientRect().height ?? 0;

      const available =
        window.innerHeight - top - chromeHeight - outsideChromeHeight;
      const rows = Math.floor(available / rowHeight);

      setLimit(Math.min(maxLimit, Math.max(minLimit, rows)));
    }

    computeLimit();

    let frame: number | null = null;
    let lastResizeTime = 0;

    function checkDebounce(time: DOMHighResTimeStamp) {
      if (time - lastResizeTime >= debounceDelay) {
        computeLimit();
        frame = null;
      } else {
        frame = requestAnimationFrame(checkDebounce);
      }
    }

    function onResize() {
      lastResizeTime = performance.now();

      if (frame === null) frame = requestAnimationFrame(checkDebounce);
    }

    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [
    rowHeight,
    chromeHeight,
    outsideChromeSelector,
    minLimit,
    maxLimit,
    debounceDelay,
  ]);

  return [containerRef, limit];
}
