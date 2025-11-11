/**
 * B2B Analytics Engine - The Metrics Your Customers Pay For
 * 
 * This is not just tracking - this is actionable intelligence for technical education.
 * Each metric directly translates to instructor/platform insights and decisions.
 */

import type { LearningEvent, LearningMetrics } from './events';

// ===== REAL-TIME ANALYTICS PROCESSOR =====

export class LearningAnalyticsEngine {
  
  /**
   * METRIC 1: Time-to-First-Run (TTFR)
   * B2B Insight: "How long does it take learners to get over the 'cold start'?"
   * 
   * Low TTFR = Clear problem statement
   * High TTFR = Confusing/intimidating problem
   */
  static calculateTTFR(events: LearningEvent[]): TTFRAnalysis {
    const sessionGroups = this.groupEventsBySession(events);
    const ttfrTimes: number[] = [];
    
    for (const sessionEvents of sessionGroups.values()) {
      const sessionStart = sessionEvents.find(e => e.type === 'session_start');
      const firstRun = sessionEvents.find(e => e.type === 'code_run_initiated');
      
      if (sessionStart && firstRun) {
        const ttfr = firstRun.timestamp.getTime() - sessionStart.timestamp.getTime();
        ttfrTimes.push(ttfr);
      }
    }
    
    return {
      averageTTFR: this.average(ttfrTimes),
      medianTTFR: this.median(ttfrTimes),
      percentile90: this.percentile(ttfrTimes, 0.9),
      sampleSize: ttfrTimes.length,
      insight: this.getTTFRInsight(this.median(ttfrTimes))
    };
  }
  
  /**
   * METRIC 2: Run-to-Pass Ratio (RPR)
   * B2B Insight: "How difficult is this exercise? Core difficulty calibration."
   * 
   * RPR 1:1 = Too easy
   * RPR 3-5:1 = Optimal difficulty
   * RPR 10+:1 = Too hard/frustrating
   */
  static calculateRPR(events: LearningEvent[]): RPRAnalysis {
    const sessionGroups = this.groupEventsBySession(events);
    const ratios: number[] = [];
    
    for (const sessionEvents of sessionGroups.values()) {
      const runEvents = sessionEvents.filter(e => e.type === 'code_run_initiated');
      const passEvent = sessionEvents.find(e => e.type === 'all_tests_passed');
      
      if (runEvents.length > 0) {
        const ratio = passEvent ? runEvents.length : runEvents.length; // Include failed sessions
        ratios.push(ratio);
      }
    }
    
    const avgRPR = this.average(ratios);
    
    return {
      averageRPR: avgRPR,
      medianRPR: this.median(ratios),
      difficultyCalibration: this.getRPRCalibration(avgRPR),
      successRate: ratios.filter(r => r > 0).length / ratios.length,
      sampleSize: ratios.length,
      insight: this.getRPRInsight(avgRPR)
    };
  }
  
  /**
   * METRIC 3: Specific Test Case Failure Rate
   * B2B Insight: "WHERE EXACTLY are students stuck? This is the money metric."
   * 
   * Identifies specific learning gaps and concepts that need reinforcement.
   */
  static analyzeTestCaseFailures(events: LearningEvent[]): TestCaseFailureAnalysis[] {
    const failureMap = new Map<string, TestCaseFailureData>();
    
    events.forEach(event => {
      if (event.type === 'test_case_failed') {
        const key = `${event.data.testCaseId}:${event.data.testCaseName}`;
        
        if (!failureMap.has(key)) {
          failureMap.set(key, {
            testCaseId: event.data.testCaseId,
            testCaseName: event.data.testCaseName,
            totalAttempts: 0,
            totalFailures: 0,
            errorTypes: new Map(),
            strugglingConcepts: []
          });
        }
        
        const data = failureMap.get(key)!;
        data.totalAttempts++;
        data.totalFailures++;
        
        const errorType = event.data.errorType;
        data.errorTypes.set(errorType, (data.errorTypes.get(errorType) || 0) + 1);
      }
      
      if (event.type === 'test_case_passed') {
        const key = `${event.data.testCaseId}:${event.data.testCaseName}`;
        
        if (!failureMap.has(key)) {
          failureMap.set(key, {
            testCaseId: event.data.testCaseId,
            testCaseName: event.data.testCaseName,
            totalAttempts: 0,
            totalFailures: 0,
            errorTypes: new Map(),
            strugglingConcepts: []
          });
        }
        
        const data = failureMap.get(key)!;
        data.totalAttempts++;
      }
    });
    
    return Array.from(failureMap.values()).map(data => {
      const failureRate = data.totalFailures / data.totalAttempts;
      return {
        testCaseId: data.testCaseId,
        testCaseName: data.testCaseName,
        failureRate,
        totalAttempts: data.totalAttempts,
        commonErrorTypes: Array.from(data.errorTypes.entries())
          .sort(([,a], [,b]) => b - a)
          .map(([type]) => type),
        insight: this.getTestCaseInsight(failureRate, data.testCaseName)
      };
    });
  }
  
  /**
   * METRIC 4: Give-Up Rate
   * B2B Insight: "Which problems are demoralizing learners and causing dropoff?"
   */
  static calculateGiveUpRate(events: LearningEvent[]): GiveUpAnalysis {
    const sessionGroups = this.groupEventsBySession(events);
    let totalSessions = 0;
    let giveUpSessions = 0;
    const giveUpData: GiveUpSessionData[] = [];
    
    for (const sessionEvents of sessionGroups.values()) {
      totalSessions++;
      
      const giveUpEvent = sessionEvents.find(e => e.type === 'give_up_detected');
      const completedEvent = sessionEvents.find(e => e.type === 'all_tests_passed');
      
      if (giveUpEvent && !completedEvent) {
        giveUpSessions++;
        giveUpData.push({
          timeSpent: giveUpEvent.data.timeSpentTotal,
          attempts: giveUpEvent.data.finalAttempts,
          hintsUsed: giveUpEvent.data.finalHintsUsed,
          lastFailedTestCase: giveUpEvent.data.lastFailedTestCase,
          method: giveUpEvent.data.detectionMethod
        });
      }
    }
    
    const giveUpRate = giveUpSessions / totalSessions;
    
    return {
      giveUpRate,
      averageTimeBeforeGiveUp: this.average(giveUpData.map(d => d.timeSpent)),
      averageAttemptsBeforeGiveUp: this.average(giveUpData.map(d => d.attempts)),
      commonGiveUpPoints: this.getCommonGiveUpPoints(giveUpData),
      totalSessions,
      insight: this.getGiveUpInsight(giveUpRate)
    };
  }
  
  /**
   * METRIC 5: Hint Utilization Rate  
   * B2B Insight: "Are hints useful or ignored? Hint quality assessment."
   */
  static analyzeHintUtilization(events: LearningEvent[]): HintUtilizationAnalysis {
    const sessionGroups = this.groupEventsBySession(events);
    let totalSessions = 0;
    let sessionsWithHints = 0;
    const hintData: HintSessionData[] = [];
    
    for (const sessionEvents of sessionGroups.values()) {
      totalSessions++;
      
      const hintEvents = sessionEvents.filter(e => e.type === 'hint_requested');
      const completedEvent = sessionEvents.find(e => e.type === 'all_tests_passed');
      
      if (hintEvents.length > 0) {
        sessionsWithHints++;
        hintData.push({
          hintsUsed: hintEvents.length,
          completed: !!completedEvent,
          hintTypes: hintEvents.map(e => e.data.hintType)
        });
      }
    }
    
    const successAfterHints = hintData.filter(d => d.completed).length;
    
    return {
      hintRequestRate: sessionsWithHints / totalSessions,
      averageHintsPerSession: this.average(hintData.map(d => d.hintsUsed)),
      hintEffectivenessScore: successAfterHints / hintData.length,
      mostRequestedHintTypes: this.getMostCommonHintTypes(hintData),
      insight: this.getHintUtilizationInsight(sessionsWithHints / totalSessions)
    };
  }
  
  // ===== UTILITY METHODS =====
  
  private static groupEventsBySession(events: LearningEvent[]): Map<string, LearningEvent[]> {
    const groups = new Map<string, LearningEvent[]>();
    
    events.forEach(event => {
      if (!groups.has(event.sessionId)) {
        groups.set(event.sessionId, []);
      }
      groups.get(event.sessionId)!.push(event);
    });
    
    return groups;
  }
  
  private static average(numbers: number[]): number {
    return numbers.length > 0 ? numbers.reduce((a, b) => a + b, 0) / numbers.length : 0;
  }
  
  private static median(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }
  
  private static percentile(numbers: number[], p: number): number {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)];
  }
  
  // ===== INSIGHT GENERATORS (B2B VALUE) =====
  
  private static getTTFRInsight(medianTTFR: number): string {
    if (medianTTFR < 30000) return "Excellent: Learners engage immediately";
    if (medianTTFR < 60000) return "Good: Clear problem statement";
    if (medianTTFR < 120000) return "Concerning: Problem may be intimidating";
    return "Critical: Problem statement needs simplification";
  }
  
  private static getRPRCalibration(avgRPR: number): 'too_easy' | 'optimal' | 'too_hard' {
    if (avgRPR < 2) return 'too_easy';
    if (avgRPR <= 5) return 'optimal';
    return 'too_hard';
  }
  
  private static getRPRInsight(avgRPR: number): string {
    if (avgRPR < 2) return "Too Easy: Consider adding complexity or edge cases";
    if (avgRPR <= 5) return "Optimal Difficulty: Well-calibrated challenge level";
    return "Too Hard: Simplify requirements or add progressive hints";
  }
  
  private static getTestCaseInsight(failureRate: number, testCaseName: string): string {
    if (failureRate > 0.7) return `Critical Gap: ${testCaseName} concept needs dedicated instruction`;
    if (failureRate > 0.4) return `Learning Opportunity: ${testCaseName} could use more examples`;
    return `Well Understood: ${testCaseName} is clear to most learners`;
  }
  
  private static getGiveUpInsight(giveUpRate: number): string {
    if (giveUpRate > 0.3) return "High Abandonment: Exercise is demoralizing learners";
    if (giveUpRate > 0.15) return "Moderate Difficulty: Some learners struggling";
    return "Appropriate Challenge: Low abandonment rate";
  }
  
  private static getHintUtilizationInsight(hintRequestRate: number): string {
    if (hintRequestRate < 0.2) return "Hints Ignored: Either too obvious or problem too easy";
    if (hintRequestRate > 0.6) return "Hint Dependent: Problem may be too challenging";
    return "Balanced: Hints are appropriately utilized";
  }
  
  private static getCommonGiveUpPoints(data: GiveUpSessionData[]): string[] {
    const testCases = data
      .map(d => d.lastFailedTestCase)
      .filter(Boolean) as string[];
    
    return [...new Set(testCases)]
      .map(testCase => ({
        testCase,
        count: testCases.filter(t => t === testCase).length
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(item => item.testCase);
  }
  
  private static getMostCommonHintTypes(data: HintSessionData[]): string[] {
    const allHintTypes = data.flatMap(d => d.hintTypes);
    return [...new Set(allHintTypes)]
      .map(type => ({
        type,
        count: allHintTypes.filter(t => t === type).length
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(item => item.type);
  }
}

// ===== TYPE DEFINITIONS =====

export interface TTFRAnalysis {
  averageTTFR: number;
  medianTTFR: number;
  percentile90: number;
  sampleSize: number;
  insight: string;
}

export interface RPRAnalysis {
  averageRPR: number;
  medianRPR: number;
  difficultyCalibration: 'too_easy' | 'optimal' | 'too_hard';
  successRate: number;
  sampleSize: number;
  insight: string;
}

export interface TestCaseFailureAnalysis {
  testCaseId: string;
  testCaseName: string;
  failureRate: number;
  totalAttempts: number;
  commonErrorTypes: string[];
  insight: string;
}

export interface GiveUpAnalysis {
  giveUpRate: number;
  averageTimeBeforeGiveUp: number;
  averageAttemptsBeforeGiveUp: number;
  commonGiveUpPoints: string[];
  totalSessions: number;
  insight: string;
}

export interface HintUtilizationAnalysis {
  hintRequestRate: number;
  averageHintsPerSession: number;
  hintEffectivenessScore: number;
  mostRequestedHintTypes: string[];
  insight: string;
}

// ===== INTERNAL DATA STRUCTURES =====

interface TestCaseFailureData {
  testCaseId: string;
  testCaseName: string;
  totalAttempts: number;
  totalFailures: number;
  errorTypes: Map<string, number>;
  strugglingConcepts: string[];
}

interface GiveUpSessionData {
  timeSpent: number;
  attempts: number;
  hintsUsed: number;
  lastFailedTestCase?: string;
  method: string;
}

interface HintSessionData {
  hintsUsed: number;
  completed: boolean;
  hintTypes: string[];
}