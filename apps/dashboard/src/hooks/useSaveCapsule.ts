import { useState } from 'react';
import { apiClient } from '../lib/api/client';

interface SaveCapsuleData {
  title?: string;
  description?: string;
  content?: any;
  runtime?: any;
  pedagogy?: any;
  isPublished?: boolean;
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  if (typeof window === 'undefined') return headers;
  try {
    const stored = localStorage.getItem('devcapsules_auth');
    if (stored) {
      const auth = JSON.parse(stored);
      if (auth.accessToken && auth.expiresAt > Date.now()) {
        headers['Authorization'] = `Bearer ${auth.accessToken}`;
      }
    }
  } catch { /* ignore */ }
  return headers;
}

export function useSaveCapsule() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveCapsule = async (capsuleId: string, updates: SaveCapsuleData) => {
    try {
      setSaving(true);
      setError(null);
      
      const apiUrl = apiClient.getApiUrl();
      const response = await fetch(`${apiUrl}/api/v1/capsules/${capsuleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save capsule (${response.status})`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to save capsule');
      }
      
      return data.capsule;
    } catch (err) {
      console.error('Error saving capsule:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return {
    saveCapsule,
    saving,
    error,
  };
}