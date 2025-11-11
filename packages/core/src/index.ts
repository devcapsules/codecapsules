// Core types
export * from './types/capsule';
export * from './types/widget';
export * from './types/analytics';
export * from './types/events';
export * from './types/analytics-engine';
export * from './types/creator-feedback';
export * from './types/runtime-aware';
export * from './types/universal-capsule';

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