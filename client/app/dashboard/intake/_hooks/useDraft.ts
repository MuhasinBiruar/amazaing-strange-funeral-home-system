import { useState, useEffect, useRef } from 'react';

export function useDraft<T extends Record<string, unknown>>(
  storageKey: string,
  initialState: T,
) {
  const [formData, setFormData] = useState<T>(initialState);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const isClearingRef = useRef(false);

  useEffect(() => {
    const savedDraft = localStorage.getItem(storageKey);
    if (savedDraft) {
      try {
        // eslint-disable-next-line
        setFormData(JSON.parse(savedDraft));
      } catch {
        localStorage.removeItem(storageKey);

        setFormData(initialState);
      }
    }
    setIsDraftLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  return { formData, isDraftLoaded, handleFormChange, clearDraft };
}
