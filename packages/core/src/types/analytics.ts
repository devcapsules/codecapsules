export interface AnalyticsEvent {
  id: string;
  widgetId: string;
  userId?: string; // null for anonymous users
  action: AnalyticsAction;
  metadata: Record<string, any>;
  timestamp: Date;
  sessionId: string;
  userAgent?: string;
  ipAddress?: string;
}

export type AnalyticsAction = 
  | 'view'           // Widget was viewed
  | 'run'            // Code was executed
  | 'hint'           // Hint was requested
  | 'fail'           // Test failed
  | 'complete'       // Exercise completed successfully
  | 'creator_edit'   // Creator made an edit
  | 'reset'          // User reset the exercise
  | 'timeout';       // Exercise timed out

export interface AnalyticsSummary {
  widgetId: string;
  totalViews: number;
  totalRuns: number;
  totalCompletions: number;
  totalHintRequests: number;
  successRate: number; // completions / runs
  averageCompletionTime?: number; // in seconds
  popularHints: string[]; // most requested hint IDs
  commonErrors: string[]; // most common error patterns
  timeRange: {
    start: Date;
    end: Date;
  };
}

export interface UserProgress {
  userId: string;
  widgetId: string;
  attempts: number;
  completed: boolean;
  lastAttemptAt: Date;
  bestScore?: number;
  totalTimeSpent: number; // in seconds
  hintsUsed: string[]; // hint IDs used
}