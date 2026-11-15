'use client';

import { useState, useEffect, useRef } from 'react';

export function useDraft<T extends Record<string, unknown>>(
  storageKey: string,
  initialState: T,
) {
  const [formData, setFormData] = useState<T>(initialState);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const isClearingRef = useRef(false);
  // Callers pass a fresh object every render; only the first one is used.
  const defaultsRef = useRef(initialState);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);

        if (
          typeof parsed === 'object' &&
          parsed !== null &&
          !Array.isArray(parsed)
        ) {
          // Merge over the defaults: a draft saved by an older version of the
          // form lacks fields added since, which would otherwise be undefined.
          setFormData({ ...defaultsRef.current, ...(parsed as Partial<T>) });
        } else {
          localStorage.removeItem(storageKey);
        }
      }
    } catch {
      localStorage.removeItem(storageKey);
    }
    setIsDraftLoaded(true);
  }, [storageKey]);

  useEffect(() => {
    if (isClearingRef.current) {
      isClearingRef.current = false;
      return;
    }

    if (isDraftLoaded) {
      localStorage.setItem(storageKey, JSON.stringify(formData));
    }
  }, [formData, isDraftLoaded, storageKey]);

  const handleFormChange = (field: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [field as keyof T]: value as T[keyof T],
    }));
  };

  const clearDraft = () => {
    isClearingRef.current = true;
    localStorage.removeItem(storageKey);
    setFormData(initialState);
  };

  return { formData, isDraftLoaded, handleFormChange, clearDraft };
}
