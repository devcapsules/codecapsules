import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Terminal, Cpu, Share2 } from 'lucide-react'

const steps = [
  {
    id: 1,
    title: 'Generate',
    desc: 'Paste a prompt. AI writes the code.',
    Icon: Terminal,
  },
  {
    id: 2,
    title: 'Refine',
    desc: 'Pedagogist Agent adds logic & hints.',
    Icon: Cpu,
  },
  {
    id: 3,
    title: 'Embed',
    desc: 'Copy one line of HTML anywhere.',
    Icon: Share2,
  },
]

export default function ProcessSteps() {
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length)
    }, 2500)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="w-full max-w-4xl mx-auto py-12 px-4">
      {/* Section Header */}
      <h3 className="text-xl md:text-2xl font-bold text-center text-white mb-12">
        From Prompt to Live Lab in 30 Seconds
      </h3>

      {/* Desktop: Horizontal Pipeline */}
      <div className="hidden md:block">
        <div className="relative flex justify-between items-start">
          
          {/* Background Line (Gray) */}
          <div className="absolute top-12 left-[12%] right-[12%] h-[2px] bg-slate-800 rounded-full" />

          {/* Active Beam (Gradient Blue) */}
          <motion.div
            className="absolute top-12 left-[12%] h-[2px] bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
            style={{
              boxShadow: '0 0 15px rgba(59, 130, 246, 0.5), 0 0 30px rgba(59, 130, 246, 0.3)'
            }}
            initial={{ width: '0%' }}
            animate={{
              width: `${(activeStep / (steps.length - 1)) * 76}%`,
            }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          />

          {/* Steps */}
          {steps.map((step, index) => {
            const isActive = index === activeStep
            const isCompleted = index < activeStep

            return (
              <div
                key={step.id}
                className="flex flex-col items-center relative z-10 cursor-pointer group"
                onClick={() => setActiveStep(index)}
                style={{ width: '33.33%' }}
              >
                {/* Icon Circle */}
                <motion.div
                  className={`
                    w-24 h-24 rounded-full flex items-center justify-center
                    border-2 transition-all duration-500 bg-slate-950
                    ${isActive 
                      ? 'border-blue-500 text-blue-400' 
                      : isCompleted 
                        ? 'border-blue-800 text-blue-600' 
                        : 'border-slate-700 text-slate-500'
                    }
                  `}
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    boxShadow: isActive 
                      ? '0 0 40px rgba(59, 130, 246, 0.5), 0 0 60px rgba(59, 130, 246, 0.3)' 
                      : 'none'
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <step.Icon size={32} strokeWidth={1.5} />
                </motion.div>

                {/* Text Content */}
                <div className="mt-6 text-center max-w-[180px]">
                  <motion.h4 
                    className={`text-lg font-semibold transition-colors duration-300 ${
                      isActive ? 'text-white' : 'text-slate-500'
                    }`}
                  >
                    {step.title}
                  </motion.h4>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                {/* Glow Effect */}
                {isActive && (
                  <motion.div
                    className="absolute top-6 left-1/2 -translate-x-1/2 w-32 h-32 bg-blue-500/20 blur-[60px] -z-10 pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}

                {/* Step Number */}
                <motion.div
                  className={`
                    absolute -top-2 w-6 h-6 rounded-full flex items-center justify-center
                    text-xs font-bold transition-all duration-300
                    ${isActive 
                      ? 'bg-blue-500 text-white' 
                      : isCompleted 
                        ? 'bg-blue-800 text-blue-200' 
                        : 'bg-slate-800 text-slate-500'
                    }
                  `}
                  style={{ left: 'calc(50% + 36px)' }}
                >
                  {step.id}
                </motion.div>
              </div>
            )
          })}
        </div>

        {/* Progress Indicator Dots */}
        <div className="flex justify-center gap-2 mt-10">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveStep(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === activeStep 
                  ? 'bg-blue-500 w-6' 
                  : 'bg-slate-700 hover:bg-slate-600'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Mobile: Vertical Pipeline */}
      <div className="md:hidden">
        <div className="relative">
          <div className="space-y-10">
            {steps.map((step, index) => {
              const isActive = index === activeStep
              const isCompleted = index < activeStep

              return (
                <div
                  key={step.id}
                  className="flex flex-col items-center text-center relative"
                  onClick={() => setActiveStep(index)}
                >
                  {/* Icon Circle */}
                  <motion.div
                    className={`
                      w-16 h-16 rounded-full flex items-center justify-center
                      border-2 transition-all duration-500 bg-slate-950 z-10
                      ${isActive 
                        ? 'border-blue-500 text-blue-400' 
                        : isCompleted 
                          ? 'border-blue-800 text-blue-600' 
                          : 'border-slate-700 text-slate-500'
                      }
                    `}
                    animate={{
                      scale: isActive ? 1.15 : 1,
                      boxShadow: isActive 
                        ? '0 0 30px rgba(59, 130, 246, 0.5)' 
                        : 'none'
                    }}
                  >
                    <step.Icon size={24} strokeWidth={1.5} />
                  </motion.div>

                  {/* Text - below icon */}
                  <div className="mt-4 px-4">
                    <h4 className={`text-lg font-semibold transition-colors duration-300 ${
                      isActive ? 'text-white' : 'text-slate-500'
                    }`}>
                      {step.title}
                    </h4>
                    <p className="text-sm text-slate-500 mt-1 max-w-[200px] mx-auto">
                      {step.desc}
                    </p>
                  </div>

                  {/* Glow Effect */}
                  {isActive && (
                    <motion.div
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-24 bg-blue-500/20 blur-[40px] -z-10 pointer-events-none"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Progress Indicator Dots - Mobile */}
        <div className="flex justify-center gap-2 mt-8">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveStep(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === activeStep 
                  ? 'bg-blue-500 w-6' 
                  : 'bg-slate-700 hover:bg-slate-600'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
