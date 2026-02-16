import { Router } from 'express';
// Import the shared Prisma client from the database package
import { prisma } from '../../../../packages/database/src/client';

const router = Router();

// Use Prisma-generated types

/**
 * Pro Tier Analytics Endpoints (Content Engagement)
 * For bloggers and content creators ($29/mo)
 */

// Get capsule engagement overview
router.get('/pro/capsules/:id/engagement', async (req, res) => {
  try {
    const { id } = req.params;
    const { days = 30 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));
    
    // Get hourly stats aggregated for the time period  
    const stats = await (prisma as any).capsuleHourlyStats.findMany({
      where: {
        capsuleId: id,
        hourBucket: {
          gte: startDate
        }
      },
      orderBy: {
        hourBucket: 'desc'
      }
    });
    
    // Calculate aggregated metrics
    const totalImpressions = stats.reduce((sum: number, s: any) => sum + s.uniqueUsers, 0);
    const totalSessions = stats.reduce((sum: number, s: any) => sum + s.totalSessions, 0);
    const totalRuns = stats.reduce((sum: number, s: any) => sum + s.totalRuns, 0);
    const successfulRuns = stats.reduce((sum: number, s: any) => sum + s.successfulRuns, 0);
    
    const engagementRate = totalSessions > 0 ? totalSessions / totalImpressions : 0;
    const completionRate = totalRuns > 0 ? successfulRuns / totalRuns : 0;
    
    res.json({
      capsuleId: id,
      period: `${days} days`,
      metrics: {
        totalImpressions,
        engagementRate: Math.round(engagementRate * 100) / 100,
        completionRate: Math.round(completionRate * 100) / 100,
        totalSessions,
        avgSessionTime: stats.length > 0 ? 
          Math.round(stats.reduce((sum: number, s: any) => sum + s.avgSessionDurationSeconds, 0) / stats.length) : 0
      },
      hourlyData: stats.map((s: any) => ({
        hour: s.hourBucket,
        impressions: s.uniqueUsers,
        sessions: s.totalSessions,
        runs: s.totalRuns,
        completionRate: s.totalRuns > 0 ? s.successfulRuns / s.totalRuns : 0
      }))
    });
    
  } catch (error) {
    console.error('Error fetching engagement data:', error);
    res.status(500).json({ error: 'Failed to fetch engagement data' });
  }
});

// Get top performing capsules for a creator
router.get('/pro/creator/:userId/top-capsules', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;
    
    // Get creator's capsules with analytics
    const capsules = await prisma.capsule.findMany({
      where: {
        creatorId: userId,
        isPublished: true
      },
      select: {
        id: true,
        title: true,
        createdAt: true
      }
    });
    
    // Get analytics for each capsule (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const capsuleStats = await Promise.all(
      capsules.map(async (capsule: any) => {
        const stats = await (prisma as any).capsuleHourlyStats.findMany({
          where: {
            capsuleId: capsule.id,
            hourBucket: {
              gte: thirtyDaysAgo
            }
          }
        });
        
        const totalImpressions = stats.reduce((sum: number, s: any) => sum + s.uniqueUsers, 0);
        const totalSessions = stats.reduce((sum: number, s: any) => sum + s.totalSessions, 0);
        const totalRuns = stats.reduce((sum: number, s: any) => sum + s.totalRuns, 0);
        const successfulRuns = stats.reduce((sum: number, s: any) => sum + s.successfulRuns, 0);
        
        return {
          ...capsule,
          metrics: {
            impressions: totalImpressions,
            sessions: totalSessions,
            engagementRate: totalImpressions > 0 ? totalSessions / totalImpressions : 0,
            completionRate: totalRuns > 0 ? successfulRuns / totalRuns : 0
          }
        };
      })
    );
    
    // Sort by engagement and limit
    const topCapsules = capsuleStats
      .sort((a: any, b: any) => b.metrics.sessions - a.metrics.sessions)
      .slice(0, Number(limit));
    
    res.json({
      creatorId: userId,
      topCapsules
    });
    
  } catch (error) {
    console.error('Error fetching top capsules:', error);
    res.status(500).json({ error: 'Failed to fetch top capsules' });
  }
});

/**
 * B2B Cohort Analytics Endpoints (Student Progress)
 * For bootcamp instructors and organizations ($99/mo)
 */

// Get cohort overview
router.get('/cohort/organization/:orgId/overview', async (req, res) => {
  try {
    const { orgId } = req.params;
    const { days = 7 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));
    
    // Get organization daily stats
    const orgStats = await (prisma as any).organizationDailyStats.findMany({
      where: {
        organizationId: orgId,
        date: {
          gte: startDate
        }
      },
      orderBy: {
        date: 'desc'
      }
    });
    
    // Get individual student progress
    const students = await prisma.user.findMany({
      where: {
        // Add organization relationship to User model
        // organizationId: orgId  // This would need to be added to the schema
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });
    
    const studentProgress = await Promise.all(
      students.map(async (student: any) => {
        const dailyStats = await (prisma as any).userDailyStats.findMany({
          where: {
            userId: student.id,
            date: {
              gte: startDate
            }
          }
        });
        
        const totalAttempted = dailyStats.reduce((sum: number, s: any) => sum + s.capsulesAttempted, 0);
        const totalCompleted = dailyStats.reduce((sum: number, s: any) => sum + s.capsulesCompleted, 0);
        const avgAttempts = dailyStats.length > 0 ? 
          dailyStats.reduce((sum: number, s: any) => sum + Number(s.avgAttemptsPerCapsule), 0) / dailyStats.length : 0;
        
        return {
          ...student,
          progress: {
            attempted: totalAttempted,
            completed: totalCompleted,
            completionRate: totalAttempted > 0 ? totalCompleted / totalAttempted : 0,
            avgAttempts: Math.round(avgAttempts * 100) / 100,
            isAtRisk: avgAttempts > 5 || (totalAttempted > 0 && totalCompleted / totalAttempted < 0.3)
          }
        };
      })
    );
    
    // Calculate cohort metrics
    const totalStudents = students.length;
    const activeStudents = studentProgress.filter((s: any) => s.progress.attempted > 0).length;
    const atRiskStudents = studentProgress.filter((s: any) => s.progress.isAtRisk).length;
    const avgCompletionRate = studentProgress.length > 0 ?
      studentProgress.reduce((sum: number, s: any) => sum + s.progress.completionRate, 0) / studentProgress.length : 0;
    
    res.json({
      organizationId: orgId,
      period: `${days} days`,
      cohortMetrics: {
        totalStudents,
        activeStudents,
        atRiskStudents,
        avgCompletionRate: Math.round(avgCompletionRate * 100) / 100
      },
      studentProgress: studentProgress.sort((a: any, b: any) => b.progress.attempted - a.progress.attempted),
      dailyStats: orgStats
    });
    
  } catch (error) {
    console.error('Error fetching cohort data:', error);
    res.status(500).json({ error: 'Failed to fetch cohort data' });
  }
});

/**
 * Deep Dive Analytics Endpoints (Test Case Failures)
 * The "killer feature" for enterprise sales demos
 */

// Get failing test cases for a capsule
router.get('/deep-dive/capsule/:id/failing-tests', async (req, res) => {
  try {
    const { id } = req.params;
    const { days = 30 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));
    
    // Get test case failures
    const failingTests = await (prisma as any).testCaseFailures.findMany({
      where: {
        capsuleId: id,
        date: {
          gte: startDate
        }
      },
      orderBy: {
        failureRate: 'desc'
      }
    });
    
    // Group by test case and aggregate
    const testCaseMap = new Map();
    
    failingTests.forEach((test: any) => {
      const key = test.testCaseId;
      if (!testCaseMap.has(key)) {
        testCaseMap.set(key, {
          testCaseId: test.testCaseId,
          testCaseName: test.testCaseName,
          totalAttempts: 0,
          totalFailures: 0,
          affectedUsers: new Set(),
          commonErrors: []
        });
      }
      
      const aggregated = testCaseMap.get(key);
      aggregated.totalAttempts += test.totalAttempts;
      aggregated.totalFailures += test.failureCount;
      aggregated.affectedUsers.add(test.affectedUserCount);
      
      // Merge common errors
      if (test.commonErrorMessages) {
        const errors = Array.isArray(test.commonErrorMessages) ? 
          test.commonErrorMessages : [test.commonErrorMessages];
        aggregated.commonErrors.push(...errors);
      }
    });
    
    // Convert to array and calculate rates
    const testFailures = Array.from(testCaseMap.values()).map(test => ({
      ...test,
      failureRate: test.totalAttempts > 0 ? test.totalFailures / test.totalAttempts : 0,
      affectedUserCount: Math.max(...Array.from(test.affectedUsers).filter((x): x is number => typeof x === 'number')),
      commonErrors: [...new Set(test.commonErrors)].slice(0, 5) // Top 5 unique errors
    }));
    
    // Sort by failure rate
    testFailures.sort((a, b) => b.failureRate - a.failureRate);
    
    res.json({
      capsuleId: id,
      period: `${days} days`,
      failingTests: testFailures.slice(0, 20), // Top 20 failing tests
      summary: {
        totalTestCases: testFailures.length,
        avgFailureRate: testFailures.length > 0 ?
          testFailures.reduce((sum, t) => sum + t.failureRate, 0) / testFailures.length : 0,
        mostProblematicTest: testFailures[0] || null
      }
    });
    
  } catch (error) {
    console.error('Error fetching test failure data:', error);
    res.status(500).json({ error: 'Failed to fetch test failure data' });
  }
});

// Get capsule teaching insights
router.get('/deep-dive/capsule/:id/teaching-insights', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get recent analytics for insights
    const recentStats = await (prisma as any).capsuleHourlyStats.findMany({
      where: {
        capsuleId: id,
        hourBucket: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    });
    
    // Calculate key teaching metrics
    const totalUsers = recentStats.reduce((sum: number, s: any) => sum + s.uniqueUsers, 0);
    const totalRuns = recentStats.reduce((sum: number, s: any) => sum + s.totalRuns, 0);
    const successfulRuns = recentStats.reduce((sum: number, s: any) => sum + s.successfulRuns, 0);
    const avgTimeToFirstRun = recentStats.length > 0 ?
      recentStats.reduce((sum: number, s: any) => sum + s.avgTimeToFirstRunSeconds, 0) / recentStats.length : 0;
    const avgAttemptsPerCompletion = recentStats.length > 0 ?
      recentStats.reduce((sum: number, s: any) => sum + Number(s.avgAttemptsPerCompletion), 0) / recentStats.length : 0;
    
    // Generate teaching insights
    const insights = [];
    
    if (avgTimeToFirstRun > 300) { // 5 minutes
      insights.push({
        type: 'warning',
        category: 'engagement',
        title: 'Slow Start Problem',
        description: `Students take an average of ${Math.round(avgTimeToFirstRun / 60)} minutes before running code. Consider simplifying the initial instructions or adding a "quick start" section.`,
        impact: 'high'
      });
    }
    
    if (avgAttemptsPerCompletion > 8) {
      insights.push({
        type: 'warning', 
        category: 'difficulty',
        title: 'High Attempt Count',
        description: `Students need an average of ${Math.round(avgAttemptsPerCompletion)} attempts to complete this capsule. Consider adding more hints or breaking down the problem into smaller steps.`,
        impact: 'high'
      });
    }
    
    const completionRate = totalRuns > 0 ? successfulRuns / totalRuns : 0;
    if (completionRate < 0.3) {
      insights.push({
        type: 'critical',
        category: 'completion',
        title: 'Low Completion Rate',
        description: `Only ${Math.round(completionRate * 100)}% of code runs are successful. This suggests the capsule may be too difficult or instructions unclear.`,
        impact: 'critical'
      });
    }
    
    if (completionRate > 0.9) {
      insights.push({
        type: 'success',
        category: 'completion', 
        title: 'High Success Rate',
        description: `${Math.round(completionRate * 100)}% completion rate indicates this capsule is well-balanced and clear.`,
        impact: 'positive'
      });
    }
    
    res.json({
      capsuleId: id,
      teachingInsights: insights,
      keyMetrics: {
        totalUsers,
        completionRate: Math.round(completionRate * 100) / 100,
        avgTimeToFirstRun: Math.round(avgTimeToFirstRun),
        avgAttemptsPerCompletion: Math.round(avgAttemptsPerCompletion * 100) / 100
      },
      recommendations: generateRecommendations(insights)
    });
    
  } catch (error) {
    console.error('Error fetching teaching insights:', error);
    res.status(500).json({ error: 'Failed to fetch teaching insights' });
  }
});

/**
 * Helper function to generate teaching recommendations
 */
function generateRecommendations(insights: any[]): string[] {
  const recommendations = [];
  
  const hasEngagementIssues = insights.some(i => i.category === 'engagement');
  const hasDifficultyIssues = insights.some(i => i.category === 'difficulty');
  const hasCompletionIssues = insights.some(i => i.category === 'completion' && i.type !== 'success');
  
  if (hasEngagementIssues) {
    recommendations.push("Add a 'Try It Now' button or sample code to encourage immediate interaction");
    recommendations.push("Consider adding a brief video introduction to the concept");
  }
  
  if (hasDifficultyIssues) {
    recommendations.push("Break down the problem into smaller, more manageable steps");
    recommendations.push("Add progressive hints that guide students through the solution");
  }
  
  if (hasCompletionIssues) {
    recommendations.push("Review the test cases - ensure they're testing the right things clearly");
    recommendations.push("Add example inputs/outputs to clarify expectations");
  }
  
  if (recommendations.length === 0) {
    recommendations.push("This capsule is performing well! Consider using it as a template for similar topics");
  }
  
  return recommendations;
}

export default router;