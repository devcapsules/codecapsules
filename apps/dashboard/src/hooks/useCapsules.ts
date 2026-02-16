import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/api/client';

export interface Capsule {
  id: string;
  title: string;
  description: string;
  type: string;
  language: string;
  difficulty: string;
  tags: string[];
  createdAt: string;
  isPublished: boolean;
  analytics?: {
    impressions: number;
    runs: number;
    passRate: string;
  };
}

export function useCapsules() {
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCapsules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const apiUrl = apiClient.getApiUrl();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      // Get auth token from apiClient's stored auth
      const storedAuth = typeof window !== 'undefined'
        ? localStorage.getItem('devcapsules_auth')
        : null;
      if (storedAuth) {
        try {
          const auth = JSON.parse(storedAuth);
          if (auth.accessToken && auth.expiresAt > Date.now()) {
            headers['Authorization'] = `Bearer ${auth.accessToken}`;
          }
        } catch { /* ignore parse errors */ }
      }

      const response = await fetch(`${apiUrl}/api/v1/my-capsules`, { headers });

      if (!response.ok) {
        if (response.status === 401) {
          // Not authenticated — return empty list instead of error
          setCapsules([]);
          return;
        }
        throw new Error(`Failed to fetch capsules (${response.status})`);
      }

      const data = await response.json();

      if (data.success) {
        setCapsules(data.capsules || []);
      } else {
        throw new Error(data.error || 'Failed to fetch capsules');
      }
    } catch (err) {
      console.error('Error fetching capsules:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCapsules();
  }, [fetchCapsules]);

  return {
    capsules,
    loading,
    error,
    refetch: fetchCapsules
  };
}