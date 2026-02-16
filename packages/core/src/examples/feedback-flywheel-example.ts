/**
 * Feedback Flywheel Usage Example
 * 
 * This demonstrates how to set up and use the feedback flywheel system
 * for continuous improvement of educational content.
 */

import {
  createFeedbackFlywheel,
  getEventTracker,
  type FeedbackFlywheelConfig
} from '../analytics';
import { GenerationPipeline } from '../agents/generation-pipeline';

// Example: Setting up the feedback flywheel system
export async function setupFeedbackSystem() {
  // 1. Create the generation pipeline (required dependency)
  const generationPipeline = new GenerationPipeline({
    max_generation_attempts: 3,
    enable_quality_gates: true,
    save_intermediate_results: false,
    timeout_ms: 300000, // 5 minutes
    min_educational_value: 0.7,
    min_technical_quality: 0.8,
    max_debugging_attempts: 5
  });

  // 2. Configure the feedback flywheel
  const flywheelConfig: Partial<FeedbackFlywheelConfig> = {
    // Analysis frequency
    metrics_update_interval_hours: 24,
    improvement_analysis_interval_hours: 168, // Weekly analysis
    
    // Quality standards
    quality_thresholds: {
      min_completion_rate: 0.75,      // 75% completion rate
      max_abandonment_rate: 0.25,     // Max 25% abandonment
      min_success_rate: 0.85,         // 85% success rate
      max_average_time_minutes: 12,   // Max 12 minutes
      min_satisfaction_score: 4.0,    // 4.0/5 satisfaction
      max_error_frequency: 1.5        // Max 1.5 errors per completion
    },
    
    // Auto-improvement settings
    auto_regenerate_enabled: true,
    regeneration_threshold_score: 0.6,  // Regenerate if quality < 60%
    max_regeneration_attempts: 3,
    
    // Decision thresholds
    min_data_points_for_analysis: 50,
    confidence_threshold_for_action: 0.8,
    
    // Notifications
    alert_on_critical_issues: true,
    daily_summary_enabled: true,
    weekly_insights_enabled: true
  };

  // 3. Create and start the feedback flywheel
  const flywheel = createFeedbackFlywheel(generationPipeline, flywheelConfig);
  await flywheel.start();

  console.log('🚀 Feedback Flywheel System Started!');
  console.log('   - Tracking user interactions');
  console.log('   - Analyzing content performance');
  console.log('   - Identifying improvement opportunities');
  console.log('   - Auto-regenerating poor-performing content');
  
  return flywheel;
}

// Example: Tracking user interactions
export function trackUserInteractions() {
  const tracker = getEventTracker();
  
  // Track when user starts a capsule
  tracker.trackCapsuleStarted('user123', 'capsule456', 'playlist789');
  
  // Track code submission
  tracker.trackCodeSubmitted(
    'user123',
    'capsule456', 
    'print("Hello World")',
    'success',
    undefined,
    1 // first attempt
  );
  
  // Track completion
  tracker.trackCapsuleCompleted('user123', 'capsule456', 180); // 3 minutes
  
  // Track user feedback
  tracker.trackUserRating(
    'user123',
    'capsule456',
    4, // difficulty rating (1-5)
    5  // confidence level (1-5)
  );
}

// Example: Manual capsule analysis
export async function analyzeCapsuleQuality(flywheel: any, capsuleId: string) {
  const analysis = await flywheel.analyzeCapsule(capsuleId);
  
  console.log(`Quality Analysis for Capsule ${capsuleId}:`);
  console.log(`- Quality Score: ${(analysis.quality_score * 100).toFixed(1)}%`);
  
  if (analysis.metrics) {
    console.log(`- Completion Rate: ${(analysis.metrics.completion_rate * 100).toFixed(1)}%`);
    console.log(`- Success Rate: ${(analysis.metrics.success_rate * 100).toFixed(1)}%`);
    console.log(`- Average Time: ${(analysis.metrics.average_time_seconds / 60).toFixed(1)} minutes`);
    console.log(`- Satisfaction: ${analysis.metrics.satisfaction_score.toFixed(1)}/5`);
  }
  
  if (analysis.suggestions.length > 0) {
    console.log(`\nImprovement Suggestions (${analysis.suggestions.length}):`);
    analysis.suggestions.forEach((suggestion: any, index: number) => {
      console.log(`${index + 1}. [${suggestion.priority.toUpperCase()}] ${suggestion.issue_description}`);
      console.log(`   Action: ${suggestion.suggested_action}`);
    });
  } else {
    console.log('\n✅ No improvements needed - quality is acceptable');
  }
  
  return analysis;
}

// Example: Platform overview dashboard
export async function showPlatformOverview(flywheel: any) {
  const overview = await flywheel.getQualityOverview();
  const stats = flywheel.getStats();
  
  console.log('📊 CodeCapsule Platform Quality Overview:');
  console.log('==========================================');
  console.log(`Overall Quality Score: ${(overview.overall_score * 100).toFixed(1)}%`);
  console.log(`Total Capsules: ${overview.total_capsules}`);
  console.log(`Needing Improvement: ${overview.needs_improvement}`);
  console.log(`Critical Issues: ${overview.critical_issues}`);
  console.log(`Recent Improvements: ${overview.recent_improvements}`);
  
  console.log('\n📈 System Performance:');
  console.log(`Events Processed: ${stats.total_events_processed.toLocaleString()}`);
  console.log(`Suggestions Generated: ${stats.total_improvements_suggested}`);
  console.log(`Regenerations Completed: ${stats.total_regenerations_completed}`);
  
  if (overview.top_issues.length > 0) {
    console.log('\n🔍 Top Issue Categories:');
    overview.top_issues.forEach((issue: any, index: number) => {
      console.log(`${index + 1}. ${issue.category}: ${issue.count} occurrences`);
    });
  }
  
  return { overview, stats };
}

// Example: Manual improvement trigger
export async function improveSpecificCapsule(flywheel: any, capsuleId: string) {
  console.log(`🔧 Triggering improvement for capsule ${capsuleId}...`);
  
  const result = await flywheel.improveCapsule(capsuleId);
  
  if (result.success) {
    console.log('✅ Improvement initiated successfully!');
    console.log(`   Regeneration ID: ${result.regeneration_id}`);
    console.log('   The AI will analyze issues and generate improved content.');
  } else {
    console.log('❌ Improvement failed:');
    console.log(`   ${result.message}`);
  }
  
  return result;
}

// Complete usage example
export async function fullExample() {
  console.log('🎯 CodeCapsule Feedback Flywheel Demo');
  console.log('=====================================\n');
  
  // 1. Setup the system
  const flywheel = await setupFeedbackSystem();
  
  // 2. Simulate some user interactions
  console.log('📝 Simulating user interactions...');
  trackUserInteractions();
  
  // 3. Show platform overview
  console.log('\n📊 Platform Overview:');
  await showPlatformOverview(flywheel);
  
  // 4. Analyze a specific capsule
  console.log('\n🔍 Analyzing Capsule Quality:');
  await analyzeCapsuleQuality(flywheel, 'capsule456');
  
  // 5. Demonstrate manual improvement
  console.log('\n🚀 Manual Improvement:');
  await improveSpecificCapsule(flywheel, 'capsule456');
  
  console.log('\n✨ The system will now continuously improve content based on real user data!');
  console.log('   - Low-performing capsules will be automatically regenerated');
  console.log('   - Quality will improve over time through the feedback flywheel');
  console.log('   - Users will have better learning experiences');
  
  return flywheel;
}