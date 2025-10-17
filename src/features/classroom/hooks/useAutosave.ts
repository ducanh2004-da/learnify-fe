import { useEffect, useRef } from 'react';

interface UseAutosaveOptions {
  onSave: () => void;
  delay?: number;
  enabled?: boolean;
}

export function useAutosave({ onSave, delay = 500, enabled = true }: UseAutosaveOptions) {
  const timeoutRef = useRef<number | null>(null);

  const trigger = () => {
    if (!enabled) return;
    
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = window.setTimeout(() => {
      onSave();
    }, delay);
  };

  const cancel = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const flush = () => {
    cancel();
    if (enabled) {
      onSave();
    }
  };

  useEffect(() => {
    return () => cancel();
  }, []);

  return { trigger, cancel, flush };
}