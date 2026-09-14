'use client';

import { useState, useEffect, useRef } from 'react';

export function useDraft<T extends Record<string, unknown>>(
  storageKey: string,
  initialState: T,
) {
  const [formData, setFormData] = useState<T>(() => {
    // Guard against SSR since localStorage is not available on the server
    if (typeof window === 'undefined') return initialState;

    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? (JSON.parse(saved) as T) : initialState;
    } catch {
      localStorage.removeItem(storageKey);
      return initialState;
    }
  });
  const isClearingRef = useRef(false);

  useEffect(() => {
    if (isClearingRef.current) {
      isClearingRef.current = false;
      return;
    }

    localStorage.setItem(storageKey, JSON.stringify(formData));
  }, [formData, storageKey]);

  // Accepts any string so page.tsx doesn't throw a type error
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

  return { formData, handleFormChange, clearDraft };
}
