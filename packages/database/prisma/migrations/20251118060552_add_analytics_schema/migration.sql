-- CreateEnum
CREATE TYPE "UserTier" AS ENUM ('FREE', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "CapsuleType" AS ENUM ('CODE', 'QUIZ', 'TERMINAL', 'DATABASE', 'SYSTEM_DESIGN');

-- CreateEnum
CREATE TYPE "BaseCapsuleType" AS ENUM ('CODE', 'DATABASE', 'TERMINAL');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "ExecutionStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'TIMEOUT');

-- CreateEnum
CREATE TYPE "RuntimeTarget" AS ENUM ('WASM', 'DOCKER', 'CLOUD_RUN');

-- CreateEnum
CREATE TYPE "FeedbackType" AS ENUM ('CODE_GENERATION', 'HINT_GENERATION', 'TEST_CASE_GENERATION', 'EXPLANATION_GENERATION');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELED', 'PAST_DUE', 'UNPAID');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatar" TEXT,
    "tier" "UserTier" NOT NULL DEFAULT 'FREE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authId" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "capsules" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "CapsuleType" NOT NULL,
    "language" TEXT,
    "difficulty" "Difficulty" NOT NULL,
    "tags" TEXT[],
    "capsule_type_new" "BaseCapsuleType",
    "problem_statement_md" TEXT,
    "runtime_config" JSONB,
    "config_data" JSONB,
    "content" JSONB NOT NULL,
    "runtime" JSONB NOT NULL,
    "pedagogy" JSONB NOT NULL,
    "business" JSONB NOT NULL,
    "legacyData" JSONB,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "creatorId" TEXT NOT NULL,

    CONSTRAINT "capsules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "capsule_executions" (
    "id" TEXT NOT NULL,
    "status" "ExecutionStatus" NOT NULL,
    "runtime" "RuntimeTarget" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "code" TEXT,
    "input" JSONB,
    "output" JSONB,
    "errors" TEXT[],
    "executionTime" INTEGER,
    "memoryUsage" INTEGER,
    "capsuleId" TEXT NOT NULL,
    "userId" TEXT,

    CONSTRAINT "capsule_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_analytics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "capsulesCompleted" INTEGER NOT NULL DEFAULT 0,
    "totalExecutionTime" INTEGER NOT NULL DEFAULT 0,
    "averageScore" DOUBLE PRECISION,
    "conceptsMastered" TEXT[],
    "weakAreas" TEXT[],
    "sessionDuration" INTEGER NOT NULL DEFAULT 0,
    "hintsUsed" INTEGER NOT NULL DEFAULT 0,
    "attemptsAverage" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "user_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "capsule_analytics" (
    "id" TEXT NOT NULL,
    "capsuleId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalAttempts" INTEGER NOT NULL DEFAULT 0,
    "successRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageTime" INTEGER NOT NULL DEFAULT 0,
    "popularityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commonErrors" JSONB,
    "hintsEffectiveness" JSONB,
    "userFeedback" JSONB,

    CONSTRAINT "capsule_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_feedback" (
    "id" TEXT NOT NULL,
    "type" "FeedbackType" NOT NULL,
    "originalPrompt" TEXT NOT NULL,
    "aiGeneratedContent" JSONB NOT NULL,
    "humanEditedContent" JSONB NOT NULL,
    "editSummary" TEXT,
    "qualityScore" DOUBLE PRECISION,
    "isApprovedForTraining" BOOLEAN NOT NULL DEFAULT false,
    "editCategories" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creatorId" TEXT NOT NULL,
    "capsuleId" TEXT NOT NULL,

    CONSTRAINT "creator_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tier" "UserTier" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "stripeSubscriptionId" TEXT,
    "stripeCustomerId" TEXT,
    "stripePriceId" TEXT,
    "monthlyExecutions" INTEGER NOT NULL DEFAULT 0,
    "monthlyGenerations" INTEGER NOT NULL DEFAULT 0,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_metrics" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalExecutions" INTEGER NOT NULL,
    "averageLatency" DOUBLE PRECISION NOT NULL,
    "errorRate" DOUBLE PRECISION NOT NULL,
    "wasmExecutionCost" DOUBLE PRECISION NOT NULL,
    "dockerExecutionCost" DOUBLE PRECISION NOT NULL,
    "aiGenerationCost" DOUBLE PRECISION NOT NULL,
    "activeUsers" INTEGER NOT NULL,
    "newSignups" INTEGER NOT NULL,
    "capsuleCreations" INTEGER NOT NULL,

    CONSTRAINT "system_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playlists" (
    "playlist_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "creator_id" TEXT NOT NULL,

    CONSTRAINT "playlists_pkey" PRIMARY KEY ("playlist_id")
);

-- CreateTable
CREATE TABLE "playlist_items" (
    "item_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "playlist_id" TEXT NOT NULL,
    "capsule_id" TEXT NOT NULL,

    CONSTRAINT "playlist_items_pkey" PRIMARY KEY ("item_id")
);

-- CreateTable
CREATE TABLE "playlist_progress" (
    "progress_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "current_step" INTEGER NOT NULL DEFAULT 1,
    "completed_steps" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_activity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "playlist_id" TEXT NOT NULL,
    "learner_id" TEXT,

    CONSTRAINT "playlist_progress_pkey" PRIMARY KEY ("progress_id")
);

-- CreateTable
CREATE TABLE "analytics_event_stream" (
    "id" BIGSERIAL NOT NULL,
    "event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "capsule_id" TEXT,
    "user_id" TEXT,
    "session_id" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "referrer" TEXT,
    "event_data" JSONB,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processed_at" TIMESTAMP(3),
    "batch_id" TEXT,

    CONSTRAINT "analytics_event_stream_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_capsule_hourly_stats" (
    "id" BIGSERIAL NOT NULL,
    "capsule_id" TEXT NOT NULL,
    "hour_bucket" TIMESTAMP(3) NOT NULL,
    "total_sessions" INTEGER NOT NULL DEFAULT 0,
    "unique_users" INTEGER NOT NULL DEFAULT 0,
    "total_runs" INTEGER NOT NULL DEFAULT 0,
    "successful_runs" INTEGER NOT NULL DEFAULT 0,
    "avg_session_duration_seconds" INTEGER NOT NULL DEFAULT 0,
    "avg_time_to_first_run_seconds" INTEGER NOT NULL DEFAULT 0,
    "avg_attempts_per_completion" DECIMAL(4,2) NOT NULL DEFAULT 0,
    "completion_rate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "hint_usage_rate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "solution_view_rate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "total_errors" INTEGER NOT NULL DEFAULT 0,
    "common_error_types" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_capsule_hourly_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_user_daily_stats" (
    "id" BIGSERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "capsules_attempted" INTEGER NOT NULL DEFAULT 0,
    "capsules_completed" INTEGER NOT NULL DEFAULT 0,
    "total_runs" INTEGER NOT NULL DEFAULT 0,
    "successful_runs" INTEGER NOT NULL DEFAULT 0,
    "session_duration_seconds" INTEGER NOT NULL DEFAULT 0,
    "hints_used" INTEGER NOT NULL DEFAULT 0,
    "concepts_mastered" TEXT[],
    "avg_attempts_per_capsule" DECIMAL(4,2) NOT NULL DEFAULT 0,
    "completion_streak" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_user_daily_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_organization_daily_stats" (
    "id" BIGSERIAL NOT NULL,
    "organization_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "active_students" INTEGER NOT NULL DEFAULT 0,
    "total_sessions" INTEGER NOT NULL DEFAULT 0,
    "avg_session_duration_seconds" INTEGER NOT NULL DEFAULT 0,
    "total_capsules_completed" INTEGER NOT NULL DEFAULT 0,
    "overall_success_rate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "avg_attempts_per_completion" DECIMAL(4,2) NOT NULL DEFAULT 0,
    "at_risk_student_count" INTEGER NOT NULL DEFAULT 0,
    "top_struggling_concepts" TEXT[],
    "most_failed_test_cases" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_organization_daily_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_test_case_failures" (
    "id" BIGSERIAL NOT NULL,
    "capsule_id" TEXT NOT NULL,
    "test_case_id" TEXT NOT NULL,
    "test_case_name" TEXT,
    "date" DATE NOT NULL,
    "total_attempts" INTEGER NOT NULL DEFAULT 0,
    "failure_count" INTEGER NOT NULL DEFAULT 0,
    "failure_rate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "common_error_messages" JSONB,
    "affected_user_count" INTEGER,
    "avg_attempts_before_success" DECIMAL(4,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_test_case_failures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_active_sessions" (
    "session_id" TEXT NOT NULL,
    "user_id" TEXT,
    "capsule_id" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_activity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "current_code" TEXT,
    "attempts_count" INTEGER NOT NULL DEFAULT 0,
    "hints_used" INTEGER NOT NULL DEFAULT 0,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL DEFAULT (NOW() + INTERVAL '1 hour'),

    CONSTRAINT "analytics_active_sessions_pkey" PRIMARY KEY ("session_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_authId_key" ON "users"("authId");

-- CreateIndex
CREATE UNIQUE INDEX "user_analytics_userId_date_key" ON "user_analytics"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "capsule_analytics_capsuleId_date_key" ON "capsule_analytics"("capsuleId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripeSubscriptionId_key" ON "subscriptions"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "system_metrics_date_key" ON "system_metrics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "playlist_items_playlist_id_order_key" ON "playlist_items"("playlist_id", "order");

-- CreateIndex
CREATE UNIQUE INDEX "playlist_items_playlist_id_capsule_id_key" ON "playlist_items"("playlist_id", "capsule_id");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_capsule_hourly_stats_capsule_id_hour_bucket_key" ON "analytics_capsule_hourly_stats"("capsule_id", "hour_bucket");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_user_daily_stats_user_id_date_key" ON "analytics_user_daily_stats"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_organization_daily_stats_organization_id_date_key" ON "analytics_organization_daily_stats"("organization_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_test_case_failures_capsule_id_test_case_id_date_key" ON "analytics_test_case_failures"("capsule_id", "test_case_id", "date");

-- AddForeignKey
ALTER TABLE "capsules" ADD CONSTRAINT "capsules_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capsule_executions" ADD CONSTRAINT "capsule_executions_capsuleId_fkey" FOREIGN KEY ("capsuleId") REFERENCES "capsules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_analytics" ADD CONSTRAINT "user_analytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capsule_analytics" ADD CONSTRAINT "capsule_analytics_capsuleId_fkey" FOREIGN KEY ("capsuleId") REFERENCES "capsules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_feedback" ADD CONSTRAINT "creator_feedback_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_feedback" ADD CONSTRAINT "creator_feedback_capsuleId_fkey" FOREIGN KEY ("capsuleId") REFERENCES "capsules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlists" ADD CONSTRAINT "playlists_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_items" ADD CONSTRAINT "playlist_items_playlist_id_fkey" FOREIGN KEY ("playlist_id") REFERENCES "playlists"("playlist_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_items" ADD CONSTRAINT "playlist_items_capsule_id_fkey" FOREIGN KEY ("capsule_id") REFERENCES "capsules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_progress" ADD CONSTRAINT "playlist_progress_playlist_id_fkey" FOREIGN KEY ("playlist_id") REFERENCES "playlists"("playlist_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_progress" ADD CONSTRAINT "playlist_progress_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
