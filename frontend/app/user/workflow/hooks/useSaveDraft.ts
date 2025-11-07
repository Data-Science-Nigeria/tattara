'use client';

import { useState, useCallback } from 'react';

interface SaveDraftOptions {
  workflowId: string;
  type: 'form' | 'text' | 'audio' | 'image';
}

export function useSaveDraft({ workflowId, type }: SaveDraftOptions) {
  const [isSaving, setIsSaving] = useState(false);
  const storageKey = `workflow-${workflowId}-${type}`;

  const saveDraft = useCallback(
    async (data: Record<string, unknown>) => {
      setIsSaving(true);
      try {
        const saveData = {
          ...data,
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem(storageKey, JSON.stringify(saveData));
        alert('Draft saved successfully!');
      } catch (error) {
        console.error('Failed to save draft:', error);
        alert('Failed to save draft.');
      } finally {
        setIsSaving(false);
      }
    },
    [storageKey]
  );

  const loadDraft = useCallback(() => {
    try {
      const savedData = localStorage.getItem(storageKey);
      return savedData ? JSON.parse(savedData) : null;
    } catch (error) {
      console.error('Failed to load draft:', error);
      return null;
    }
  }, [storageKey]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  return {
    saveDraft,
    loadDraft,
    clearDraft,
    isSaving,
  };
}
