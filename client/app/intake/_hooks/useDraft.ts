import { useState, useEffect } from 'react';

export function useDraft(storageKey: string, initialState: any) {
  const [formData, setFormData] = useState(initialState);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);

  // Loads from local storage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(storageKey);
    if (savedDraft) {
      setFormData(JSON.parse(savedDraft));
    }
    setIsDraftLoaded(true);
  }, [storageKey]);

  // Autosave on keystroke
  useEffect(() => {
    if (isDraftLoaded) {
      localStorage.setItem(storageKey, JSON.stringify(formData));
    }
  }, [formData, isDraftLoaded, storageKey]);

  // Universal change handler
  const handleFormChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  // Wipe the draft helper
  const clearDraft = () => {
    localStorage.removeItem(storageKey);
    setFormData(initialState);
  };

  return { formData, isDraftLoaded, handleFormChange, clearDraft };
}
