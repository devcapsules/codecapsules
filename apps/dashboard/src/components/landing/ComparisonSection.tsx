import React from 'react';

export function ComparisonSection() {
  return (
    <section className="py-16 lg:py-24 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
            Why Instructors Choose <span className="text-blue-400">CodeCapsule</span> Over Alternatives
          </h2>
        </div>

        {/* Comparison Table */}
        <div className="bg-gray-800/50 rounded-2xl overflow-hidden border border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-300">Feature</th>
                  <th className="px-4 py-4 text-center text-sm font-semibold text-blue-400 bg-blue-500/10">CodeCapsule</th>
                  <th className="px-4 py-4 text-center text-sm font-semibold text-gray-300">Educative</th>
                  <th className="px-4 py-4 text-center text-sm font-semibold text-gray-300">CodeSandbox</th>
                  <th className="px-4 py-4 text-center text-sm font-semibold text-gray-300">Manual Setup</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                <tr>
                  <td className="px-4 py-4 text-sm font-medium text-white">AI Widget Generation</td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-green-400 text-lg">✅</span>
                      <span className="text-xs text-gray-400 mt-1">30 seconds</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-red-400 text-lg">❌</span>
                      <span className="text-xs text-gray-400 mt-1">Manual</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-red-400 text-lg">❌</span>
                      <span className="text-xs text-gray-400 mt-1">Manual</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-red-400 text-lg">❌</span>
                      <span className="text-xs text-gray-400 mt-1">Hours</span>
                    </div>
                  </td>
                </tr>
                <tr className="bg-gray-800/30">
                  <td className="px-4 py-4 text-sm font-medium text-white">Embed Anywhere</td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-green-400 text-lg">✅</span>
                      <span className="text-xs text-gray-400 mt-1">Any LMS</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-red-400 text-lg">❌</span>
                      <span className="text-xs text-gray-400 mt-1">Platform-locked</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-yellow-400 text-lg">⚠️</span>
                      <span className="text-xs text-gray-400 mt-1">Limited</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-green-400 text-lg">✅</span>
                      <span className="text-xs text-gray-400 mt-1">Yes</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-4 text-sm font-medium text-white">Auto-Grading</td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-green-400 text-lg">✅</span>
                      <span className="text-xs text-gray-400 mt-1">Built-in</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-green-400 text-lg">✅</span>
                      <span className="text-xs text-gray-400 mt-1">Yes</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-red-400 text-lg">❌</span>
                      <span className="text-xs text-gray-400 mt-1">No</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-red-400 text-lg">❌</span>
                      <span className="text-xs text-gray-400 mt-1">No</span>
                    </div>
                  </td>
                </tr>
                <tr className="bg-gray-800/30">
                  <td className="px-4 py-4 text-sm font-medium text-white">Student Setup</td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-green-400 text-lg">✅</span>
                      <span className="text-xs text-gray-400 mt-1">Zero</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-green-400 text-lg">✅</span>
                      <span className="text-xs text-gray-400 mt-1">Zero</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-yellow-400 text-lg">⚠️</span>
                      <span className="text-xs text-gray-400 mt-1">Account needed</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-red-400 text-lg">❌</span>
                      <span className="text-xs text-gray-400 mt-1">Complex</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-4 text-sm font-medium text-white">Analytics</td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-green-400 text-lg">✅</span>
                      <span className="text-xs text-gray-400 mt-1">Real-time</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-green-400 text-lg">✅</span>
                      <span className="text-xs text-gray-400 mt-1">Yes</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-yellow-400 text-lg">⚠️</span>
                      <span className="text-xs text-gray-400 mt-1">Basic</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-red-400 text-lg">❌</span>
                      <span className="text-xs text-gray-400 mt-1">No</span>
                    </div>
                  </td>
                </tr>
                <tr className="bg-gray-800/30">
                  <td className="px-4 py-4 text-sm font-medium text-white">Price (per month)</td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-2xl font-bold text-blue-400">$49</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-xl font-bold text-gray-300">$449</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-xl font-bold text-gray-300">$40/user</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-gray-300">Free</span>
                      <span className="text-xs text-gray-400 mt-1">(time cost)</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-8">
          <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg shadow-blue-500/25">
            Try CodeCapsule Risk-Free
          </button>
        </div>
      </div>
    </section>
  );
}