// Legacy types (for backward compatibility)
export * from './types/capsule';
export * from './types/widget';
export * from './types/analytics';
export * from './types/events';
export * from './types/analytics-engine';
export * from './types/creator-feedback';
export * from './types/runtime-aware';
export * from './types/universal-capsule';

// NEW: Production-ready unified architecture (explicit exports to avoid conflicts)
export type {
  BaseCapsule,
  CodeConfig,
  DatabaseConfig as BaseDatabaseConfig,
  TerminalConfig,
  GenerationContext,
  GenerationResult as BaseGenerationResult,
  ValidationResult as BaseValidationResult,
  ExecutionError,
  CapsuleLanguage,
  CapsuleDifficulty,
  CapsuleType as BaseCapsuleType,
  RuntimeTier
} from './types/base-capsule';

export type {
  Playlist,
  PlaylistItem,
  PlaylistWithCapsules,
  PlaylistProgress,
  PlaylistWidgetProps,
  PlaylistWidgetState,
  PlaylistNavigation,
  CreatePlaylistRequest,
  UpdatePlaylistRequest,
  PlaylistEmbedResponse,
  PlaylistAnalytics,
  PlaylistEmbedOptions,
  PlaylistEmbedCode
} from './types/playlist';

export { 
  isCodeConfig, 
  isDatabaseConfig, 
  isTerminalConfig,
  getDefaultRuntimeTier,
  createBaseCapsuleTemplate
} from './types/base-capsule';

// Analytics and Feedback Flywheel System
export type {
  UserEvent,
  EventType,
  EventData,
  ContentMetrics,
  QualityThresholds,
  ImprovementSuggestion,
  ImprovementCategory,
  ErrorPattern,
  LearningPath,
  FeedbackFlywheelConfig,
  FeedbackFlywheelStats,
  EventTrackerConfig,
  AnalyticsCollectorConfig,
  QualityMetricsConfig,
  FeedbackProcessorConfig,
  RegenerationRequest,
  RegenerationResult,
  ErrorSignature,
  MentorHint,
  MentorRequest,
  MentorResponse,
  MentorAnalytics,
  MentorConfig
} from './analytics';

export {
  FeedbackFlywheel,
  createFeedbackFlywheel,
  getFeedbackFlywheel,
  EventTracker,
  getEventTracker,
  initializeEventTracker,
  AnalyticsCollector,
  QualityMetrics,
  FeedbackProcessor,
  AIMentor,
  createAIMentor,
  createAnalyticsSystem,
  trackEvent
} from './analytics';

export {
  generatePlaylistEmbedCode,
  createPlaylistTemplate,
  calculateCompletionRate
} from './types/playlist';

// NEW: AI Agent Pipeline
export type {
  CapsuleIdea,
  PedagogicalAnalysis,
  PedagogistConfig
} from './agents/pedagogist-agent';

export type {
  ImplementationPlan,
  CodeGenerationResult,
  CoderConfig
} from './agents/coder-agent';

export type {
  ErrorAnalysis,
  FixAttempt,
  DebuggingSession,
  DebuggerConfig
} from './agents/debugger-agent';

export {
  PedagogistAgent,
  createPedagogistAgent,
  validateEducationalIdea
} from './agents/pedagogist-agent';

export {
  CoderAgent,
  createCoderAgent,
  validateTechnicalImplementation
} from './agents/coder-agent';

export {
  DebuggerAgent,
  createDebuggerAgent,
  analyzeDebuggingSession
} from './agents/debugger-agent';

// Generation Pipeline (orchestrator)
export type {
  GenerationPipelineConfig,
  PipelineGenerationResult,
  PipelineStats
} from './agents/generation-pipeline';

export {
  GenerationPipeline,
  createGenerationPipeline,
  analyzePipelinePerformance
} from './agents/generation-pipeline';

// Universal Interface (Primary Export)
export type { UniversalCapsule, Capsule } from './types/universal-capsule';
export { CapsuleMigrator, UniversalCapsuleValidator } from './types/universal-capsule';

// Generators (to be implemented)
export * from './services/ai-service';
export * from './generators/generation-engine';

// Validators (to be implemented)
export * from './validators';

// Normalizers (to be implemented)
export * from './normalizers';