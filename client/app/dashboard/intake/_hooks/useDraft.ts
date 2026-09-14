'use client';

import { useState, useEffect, useRef } from 'react';

export function useDraft<T extends Record<string, unknown>>(
  storageKey: string,
  initialState: T,
) {
  const [formData, setFormData] = useState<T>(initialState);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const isClearingRef = useRef(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setFormData(JSON.parse(saved) as T);
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
