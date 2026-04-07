import { useState, useEffect, useCallback } from 'react';

export interface SoftLoginData {
  name: string;
  phone: string;
  createdAt: string;
}

const STORAGE_KEY = 'devcapsules_learner';

export function useSoftLogin() {
  const [learner, setLearner] = useState<SoftLoginData | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLearner(JSON.parse(raw));
    } catch {
      // corrupted data — ignore
    }
  }, []);

  const saveLearner = useCallback((name: string, phone: string) => {
    const data: SoftLoginData = { name: name.trim(), phone: phone.trim(), createdAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setLearner(data);
  }, []);

  const clearLearner = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setLearner(null);
  }, []);

  return { learner, saveLearner, clearLearner };
}
