import React, { useEffect, useRef, useState } from 'react';

export function ValuePropsSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-16 lg:py-24 bg-gray-950 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl animate-float delay-1000"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header with animations */}
        <div className={`text-center mb-12 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
            Perfect for Every Type of <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent animate-gradient-x bg-[length:200%_auto]">Technical Creator</span>
          </h2>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            Whether you're teaching, documenting, or explaining — make your content interactive
          </p>
        </div>

        {/* 4-Column Value Props Grid with stagger animations */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Course Creators */}
          <div className={`bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center hover:border-blue-500/50 transition-all duration-500 hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 group ${isVisible ? 'opacity-100 translate-y-0 animate-slide-up' : 'opacity-0 translate-y-8'}`} style={{ animationDelay: '200ms' }}>
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-500/30 transition-all duration-300 group-hover:animate-pulse">
              <span className="text-3xl group-hover:scale-110 transition-transform duration-300">🎓</span>
            </div>
            <h3 className="text-lg font-bold mb-3 text-blue-400 group-hover:text-blue-300 transition-colors">Course Creators</h3>
            <p className="text-gray-300 text-sm leading-relaxed mb-4 group-hover:text-gray-200 transition-colors">
              Boost completion rates by 2-3x with hands-on coding exercises embedded directly in your lessons.
            </p>
            <div className="text-xs text-gray-400 space-y-1 group-hover:text-gray-300 transition-colors">
              <div>✓ Udemy, Teachable, Thinkific</div>
              <div>✓ Auto-graded exercises</div>
              <div>✓ Progress analytics</div>
            </div>
          </div>

          {/* Documentation Writers */}
          <div className={`bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center hover:border-green-500/50 transition-all duration-500 hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20 group ${isVisible ? 'opacity-100 translate-y-0 animate-slide-up' : 'opacity-0 translate-y-8'}`} style={{ animationDelay: '400ms' }}>
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-green-500/30 transition-all duration-300 group-hover:animate-pulse">
              <span className="text-3xl group-hover:scale-110 transition-transform duration-300">📚</span>
            </div>
            <h3 className="text-lg font-bold mb-3 text-green-400 group-hover:text-green-300 transition-colors">Documentation Writers</h3>
            <p className="text-gray-300 text-sm leading-relaxed mb-4 group-hover:text-gray-200 transition-colors">
              Transform boring API docs into interactive playgrounds that developers actually want to use.
            </p>
            <div className="text-xs text-gray-400 space-y-1 group-hover:text-gray-300 transition-colors">
              <div>✓ GitBook, Notion, Confluence</div>
              <div>✓ Live API testing</div>
              <div>✓ Zero setup required</div>
            </div>
          </div>

          {/* Corporate Training */}
          <div className={`bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center hover:border-purple-500/50 transition-all duration-500 hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 group ${isVisible ? 'opacity-100 translate-y-0 animate-slide-up' : 'opacity-0 translate-y-8'}`} style={{ animationDelay: '600ms' }}>
            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-purple-500/30 transition-all duration-300 group-hover:animate-pulse">
              <span className="text-3xl group-hover:scale-110 transition-transform duration-300">🏢</span>
            </div>
            <h3 className="text-lg font-bold mb-3 text-purple-400 group-hover:text-purple-300 transition-colors">Corporate Training</h3>
            <p className="text-gray-300 text-sm leading-relaxed mb-4 group-hover:text-gray-200 transition-colors">
              Onboard developers faster with interactive coding environments for internal training programs.
            </p>
            <div className="text-xs text-gray-400 space-y-1 group-hover:text-gray-300 transition-colors">
              <div>✓ LMS integration</div>
              <div>✓ Team analytics</div>
              <div>✓ SSO & compliance</div>
            </div>
          </div>

          {/* Tech Bloggers */}
          <div className={`bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center hover:border-orange-500/50 transition-all duration-500 hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/20 group ${isVisible ? 'opacity-100 translate-y-0 animate-slide-up' : 'opacity-0 translate-y-8'}`} style={{ animationDelay: '800ms' }}>
            <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-orange-500/30 transition-all duration-300 group-hover:animate-pulse">
              <span className="text-3xl group-hover:scale-110 transition-transform duration-300">✍️</span>
            </div>
            <h3 className="text-lg font-bold mb-3 text-orange-400 group-hover:text-orange-300 transition-colors">Tech Bloggers</h3>
            <p className="text-gray-300 text-sm leading-relaxed mb-4 group-hover:text-gray-200 transition-colors">
              Stand out from the crowd with tutorials that readers can interact with instead of just reading.
            </p>
            <div className="text-xs text-gray-400 space-y-1 group-hover:text-gray-300 transition-colors">
              <div>✓ Medium, Dev.to, Ghost</div>
              <div>✓ Higher engagement</div>
              <div>✓ Viral potential</div>
            </div>
          </div>
        </div>

        {/* Bottom CTA with animation */}
        <div className={`text-center mt-12 transition-all duration-1000 delay-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <p className="text-gray-400 mb-6">
            Join 10,000+ creators already making their content interactive
          </p>
          <button className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/40 relative overflow-hidden">
            <span className="relative z-10">Get Started Free</span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
          </button>
        </div>
      </div>
    </section>
  );
}