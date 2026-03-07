import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Terminal, Cpu, Share2 } from 'lucide-react'

const steps = [
  {
    id: 1,
    title: 'Generate',
    desc: 'Paste a prompt. EdGE Forge writes the code.',
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
    <div className="w-full">
      {/* Section Header */}
      <h3 className="text-base md:text-lg font-bold text-center text-white mb-8 tracking-tight">
        From Prompt to Live Lab in{' '}
        <span style={{ color: '#00ff87' }}>30 Seconds</span>
      </h3>

      {/* Desktop: Horizontal Pipeline */}
      <div className="hidden md:block">
        <div className="relative flex justify-between items-start">
          
          {/* Background Line (Gray) */}
          <div className="absolute top-12 left-[12%] right-[12%] h-[2px] bg-slate-800 rounded-full" />

          {/* Active Beam (Gradient Green) */}
          <motion.div
            className="absolute top-12 left-[12%] h-[2px] bg-gradient-to-r from-[#00ff87] to-emerald-400 rounded-full"
            style={{
              boxShadow: '0 0 15px rgba(0, 255, 135, 0.5), 0 0 30px rgba(0, 255, 135, 0.3)'
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
                      ? 'border-[#00ff87] text-[#00ff87]' 
                      : isCompleted 
                        ? 'border-green-800 text-green-600' 
                        : 'border-slate-700 text-slate-500'
                    }
                  `}
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    boxShadow: isActive 
                      ? '0 0 40px rgba(0, 255, 135, 0.5), 0 0 60px rgba(0, 255, 135, 0.3)' 
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
                    className="absolute top-6 left-1/2 -translate-x-1/2 w-32 h-32 bg-[#00ff87]/20 blur-[60px] -z-10 pointer-events-none"
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
                      ? 'bg-[#00ff87] text-black' 
                      : isCompleted 
                        ? 'bg-green-800 text-green-200' 
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
                  ? 'bg-[#00ff87] w-6' 
                  : 'bg-slate-700 hover:bg-slate-600'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Mobile: Compact Vertical Pipeline */}
      <div className="md:hidden">
        <div className="relative pl-8">
          {/* Vertical track line */}
          <div className="absolute left-[15px] top-3 bottom-3 w-[2px] bg-slate-800 rounded-full" />
          {/* Animated progress line */}
          <div
            className="absolute left-[15px] top-3 w-[2px] bg-gradient-to-b from-[#00ff87] to-emerald-500 rounded-full transition-all duration-700"
            style={{ height: `${(activeStep / (steps.length - 1)) * 100}%`, boxShadow: '0 0 8px rgba(0,255,135,0.6)' }}
          />
          <div className="space-y-6">
            {steps.map((step, index) => {
              const isActive = index === activeStep;
              const isCompleted = index < activeStep;
              return (
                <div
                  key={step.id}
                  className="flex items-start gap-4 cursor-pointer"
                  onClick={() => setActiveStep(index)}
                >
                  {/* Icon dot */}
                  <div className={`relative flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 -ml-8 z-10 bg-[#04040a] ${
                    isActive ? 'border-[#00ff87] text-[#00ff87]' : isCompleted ? 'border-green-800 text-green-600' : 'border-slate-700 text-slate-500'
                  }`}
                    style={isActive ? { boxShadow: '0 0 14px rgba(0,255,135,0.5)' } : {}}
                  >
                    <step.Icon size={14} strokeWidth={1.8} />
                  </div>
                  {/* Text */}
                  <div className="pb-2">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-sm font-bold transition-colors duration-300 ${isActive ? 'text-white' : 'text-slate-500'}`}>{step.title}</span>
                      <span className={`text-[0.65rem] font-bold px-1.5 py-0.5 rounded transition-all duration-300 ${
                        isActive ? 'bg-[#00ff87] text-black' : isCompleted ? 'bg-green-900 text-green-400' : 'bg-slate-800 text-slate-600'
                      }`}>{step.id}</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mt-6">
          {steps.map((_, index) => (
            <button key={index} onClick={() => setActiveStep(index)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === activeStep ? 'bg-[#00ff87] w-6' : 'bg-slate-700 w-1.5'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
