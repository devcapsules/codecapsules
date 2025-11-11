import type { Capsule } from './capsule';

export interface Widget {
  id: string;
  capsule: Capsule;
  embedConfig: EmbedConfig;
  analytics: WidgetAnalytics;
  status: WidgetStatus;
  verified: boolean;
  confidence: number; // 0-100
  createdAt: Date;
  updatedAt: Date;
}

export interface EmbedConfig {
  width?: string | number;
  height?: string | number;
  theme: 'light' | 'dark' | 'auto';
  showHints: boolean;
  showTests: boolean;
  allowReset: boolean;
  maxAttempts?: number;
}

export interface WidgetAnalytics {
  views: number;
  runs: number;
  completions: number;
  hintRequests: number;
  averageCompletionTime?: number; // in seconds
  successRate: number; // 0-100
}

export type WidgetStatus = 'draft' | 'published' | 'archived';

// Re-export from capsule types
export type { Capsule, ProgrammingLanguage, DifficultyLevel, CapsuleType } from './capsule';