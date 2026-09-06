import { useCallback, useEffect, useRef, useState } from 'react';

export default function useDebouncedValue<T>(
  value: T,
  delay: number,
): [T, () => void] {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timeoutRef = useRef<number>(null);
  const valueRef = useRef(value);

  const commitDebouncedValue = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setDebouncedValue(valueRef.current);
  }, []);

  useEffect(() => {
    valueRef.current = value;

    timeoutRef.current = window.setTimeout(() => {
      setDebouncedValue(value);
      timeoutRef.current = null;
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [value, delay]);

  return [debouncedValue, commitDebouncedValue];
}
