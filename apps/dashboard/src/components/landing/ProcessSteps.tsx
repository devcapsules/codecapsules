import React from 'react'

export default function ProcessSteps() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
      <div className="bg-gray-900/30 rounded-lg p-6 border border-gray-700">
        <h4 className="text-white font-medium mb-2 text-lg">1. Generate</h4>
        <p className="text-gray-400 text-sm">AI creates a unique coding challenge</p>
      </div>
      <div className="bg-gray-900/30 rounded-lg p-6 border border-gray-700">
        <h4 className="text-white font-medium mb-2 text-lg">2. Test</h4>
        <p className="text-gray-400 text-sm">Interactive playground with instant feedback</p>
      </div>
      <div className="bg-gray-900/30 rounded-lg p-6 border border-gray-700">
        <h4 className="text-white font-medium mb-2 text-lg">3. Embed</h4>
        <p className="text-gray-400 text-sm">Copy & paste anywhere in seconds</p>
      </div>
    </div>
  )
}