import React, { useState } from 'react'
import { PlayIcon } from '@heroicons/react/24/solid'

export default function DemoVideoSection() {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  
  return (
    <div className="relative py-8 md:py-16">
      {/* Header */}
      <div className="text-center mb-8 md:mb-12 px-4">
        <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 md:mb-4">
          See Devcapsules in Action
        </h3>
        <p className="text-gray-300 text-base md:text-lg max-w-2xl mx-auto">
          Watch how easy it is to go from prompt to interactive widget in seconds
        </p>
      </div>

      {/* Video Container - Minimal styling, focus on video */}
      <div className="max-w-5xl mx-auto px-4">
        <div className="relative w-full rounded-lg md:rounded-xl overflow-hidden bg-gray-900 shadow-2xl">
          <div className="aspect-video w-full">
            <video
              className="w-full h-full object-cover"
              controls
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              onLoadedData={() => setIsVideoLoaded(true)}
            >
              <source src="/devcapsules.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
          
          {!isVideoLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-600/20 to-purple-600/20">
              <div className="text-center">
                <PlayIcon className="w-12 h-12 md:w-16 md:h-16 text-blue-400 mx-auto mb-2 md:mb-4" />
                <p className="text-gray-300 text-base md:text-lg font-medium">Demo Video</p>
                <p className="text-gray-400 text-xs md:text-sm">Loading...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}