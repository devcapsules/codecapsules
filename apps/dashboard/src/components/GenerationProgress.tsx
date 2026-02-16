/**
 * GenerationProgress Component
 * 
 * Visual progress indicator for async capsule generation.
 * Shows current stage, progress bar, and ETA.
 */

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, CheckCircle2, XCircle, Sparkles, Code2, BookOpen, TestTube2, Clock } from 'lucide-react'
import type { GenerationProgress as GenerationProgressType, GenerationStage } from '../hooks/useAsyncGeneration'

interface GenerationProgressProps {
  progress: GenerationProgressType
  isGenerating: boolean
  onCancel?: () => void
}

const STAGE_ICONS: Record<GenerationStage, React.ReactNode> = {
  idle: null,
  queued: <Clock className="w-5 h-5" />,
  analyzing: <Sparkles className="w-5 h-5" />,
  'generating-code': <Code2 className="w-5 h-5" />,
  'adding-pedagogy': <BookOpen className="w-5 h-5" />,
  validating: <TestTube2 className="w-5 h-5" />,
  completed: <CheckCircle2 className="w-5 h-5 text-green-500" />,
  failed: <XCircle className="w-5 h-5 text-red-500" />,
}

const STAGE_COLORS: Record<GenerationStage, string> = {
  idle: 'bg-gray-200',
  queued: 'bg-blue-500',
  analyzing: 'bg-purple-500',
  'generating-code': 'bg-indigo-500',
  'adding-pedagogy': 'bg-teal-500',
  validating: 'bg-amber-500',
  completed: 'bg-green-500',
  failed: 'bg-red-500',
}

export function GenerationProgress({ progress, isGenerating, onCancel }: GenerationProgressProps) {
  if (progress.stage === 'idle') return null

  const formatETA = (seconds?: number) => {
    if (!seconds) return null
    if (seconds < 60) return `~${seconds}s remaining`
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `~${minutes}m ${secs}s remaining`
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              animate={isGenerating ? { rotate: 360 } : {}}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className={`p-2 rounded-lg ${
                progress.stage === 'failed' 
                  ? 'bg-red-100 dark:bg-red-900/20' 
                  : progress.stage === 'completed'
                    ? 'bg-green-100 dark:bg-green-900/20'
                    : 'bg-blue-100 dark:bg-blue-900/20'
              }`}
            >
              {isGenerating ? (
                <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
              ) : (
                STAGE_ICONS[progress.stage]
              )}
            </motion.div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {progress.stage === 'completed' 
                  ? 'Generation Complete!' 
                  : progress.stage === 'failed'
                    ? 'Generation Failed'
                    : 'Generating Capsule...'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {progress.message}
              </p>
            </div>
          </div>
          
          {isGenerating && onCancel && (
            <button
              onClick={onCancel}
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="relative h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className={`absolute left-0 top-0 h-full rounded-full ${STAGE_COLORS[progress.stage]}`}
            initial={{ width: 0 }}
            animate={{ width: `${progress.progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
          {isGenerating && (
            <motion.div
              className="absolute left-0 top-0 h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
          )}
        </div>

        {/* Progress Details */}
        <div className="flex items-center justify-between mt-3 text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            {Math.round(progress.progress)}% complete
          </span>
          {progress.eta && isGenerating && (
            <span className="text-gray-400 dark:text-gray-500">
              {formatETA(progress.eta)}
            </span>
          )}
        </div>

        {/* Stage Pipeline */}
        {isGenerating && (
          <div className="flex items-center justify-between mt-6 px-2">
            {(['analyzing', 'generating-code', 'adding-pedagogy', 'validating'] as const).map((stage, idx) => {
              const isActive = progress.stage === stage
              const isPast = getStageIndex(progress.stage) > getStageIndex(stage)
              
              return (
                <React.Fragment key={stage}>
                  <div className="flex flex-col items-center gap-1">
                    <motion.div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isPast
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                          : isActive
                            ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                      }`}
                      animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      {isPast ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        STAGE_ICONS[stage]
                      )}
                    </motion.div>
                    <span className={`text-xs ${
                      isActive 
                        ? 'text-blue-600 dark:text-blue-400 font-medium' 
                        : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      {formatStageName(stage)}
                    </span>
                  </div>
                  {idx < 3 && (
                    <div className={`flex-1 h-0.5 mx-2 ${
                      isPast 
                        ? 'bg-green-500' 
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`} />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

function getStageIndex(stage: GenerationStage): number {
  const stages: GenerationStage[] = ['idle', 'queued', 'analyzing', 'generating-code', 'adding-pedagogy', 'validating', 'completed']
  return stages.indexOf(stage)
}

function formatStageName(stage: string): string {
  return stage
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export default GenerationProgress
