import { useState, useEffect } from 'react';

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

  const fetchCapsules = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/my-capsules`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch capsules');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setCapsules(data.capsules);
      } else {
        throw new Error(data.error || 'Failed to fetch capsules');
      }
    } catch (err) {
      console.error('Error fetching capsules:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCapsules();
  }, []);

  return {
    capsules,
    loading,
    error,
    refetch: fetchCapsules
  };
}