import { useState } from 'react';

interface SaveCapsuleData {
  title?: string;
  description?: string;
  content?: any;
  runtime?: any;
  pedagogy?: any;
  isPublished?: boolean;
}

export function useSaveCapsule() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveCapsule = async (capsuleId: string, updates: SaveCapsuleData) => {
    try {
      setSaving(true);
      setError(null);
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/capsules/${capsuleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save capsule');
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