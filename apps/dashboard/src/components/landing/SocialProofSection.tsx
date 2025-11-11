import React from 'react';

export function SocialProofSection() {
  return (
    <section className="py-16 lg:py-24 bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
            Join <span className="text-green-400">1,200+ Creators</span> Making Interactive Content
          </h2>
        </div>

        {/* Metrics Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-green-400 mb-2">3x</div>
            <div className="text-gray-300 text-sm">Higher Engagement</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-blue-400 mb-2">50K+</div>
            <div className="text-gray-300 text-sm">Interactive Sessions</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-purple-400 mb-2">4.8/5</div>
            <div className="text-gray-300 text-sm">Creator Rating</div>
          </div>
        </div>

        {/* Testimonial Carousel (4 Cards in 2x2) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Testimonial 1 - Course Creator */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <div className="flex text-yellow-400 mb-4">
              ⭐⭐⭐⭐⭐
            </div>
            <blockquote className="text-gray-300 mb-6 text-sm leading-relaxed">
              "My Python course completion went from 18% to 34% in 2 weeks. Students love coding directly in the lesson instead of switching apps."
            </blockquote>
            <div className="border-t border-gray-700 pt-4">
              <div className="font-semibold text-white text-sm">Sarah K.</div>
              <div className="text-gray-400 text-xs">Course Creator (12K students on Udemy)</div>
            </div>
          </div>

          {/* Testimonial 2 - API Documentation */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <div className="flex text-yellow-400 mb-4">
              ⭐⭐⭐⭐⭐
            </div>
            <blockquote className="text-gray-300 mb-6 text-sm leading-relaxed">
              "Our API docs went from boring code samples to interactive examples. Developers actually try our APIs now instead of just reading about them."
            </blockquote>
            <div className="border-t border-gray-700 pt-4">
              <div className="font-semibold text-white text-sm">Alex Chen</div>
              <div className="text-gray-400 text-xs">DevRel at TechCorp</div>
            </div>
          </div>

          {/* Testimonial 3 - Corporate Training */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <div className="flex text-yellow-400 mb-4">
              ⭐⭐⭐⭐⭐
            </div>
            <blockquote className="text-gray-300 mb-6 text-sm leading-relaxed">
              "We onboard 500 developers annually. CodeCapsule cut our training time in half with hands-on exercises that work in our LMS."
            </blockquote>
            <div className="border-t border-gray-700 pt-4">
              <div className="font-semibold text-white text-sm">Marcus Rodriguez</div>
              <div className="text-gray-400 text-xs">L&D Director at Global Bank</div>
            </div>
          </div>

          {/* Testimonial 4 - Tech Blogger */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <div className="flex text-yellow-400 mb-4">
              ⭐⭐⭐⭐⭐
            </div>
            <blockquote className="text-gray-300 mb-6 text-sm leading-relaxed">
              "My React tutorial went viral because readers could actually play with the code. 5K upvotes on r/programming and counting!"
            </blockquote>
            <div className="border-t border-gray-700 pt-4">
              <div className="font-semibold text-white text-sm">Jamie Foster</div>
              <div className="text-gray-400 text-xs">Tech Blogger (Dev.to Top Author)</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}