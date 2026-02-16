import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export function PricingSection() {
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
    <section ref={sectionRef} id="pricing" className="py-16 lg:py-24 bg-gradient-to-br from-gray-950 via-gray-900 to-blue-950/30 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 left-20 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header with animation */}
        <div className={`text-center mb-12 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
            Simple Pricing. <span className="text-blue-400 animate-gradient-x bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent bg-[length:200%_auto]">Pay Only When Code Runs.</span>
          </h2>
          <p className="text-gray-400 text-lg">No "per student" fees. Predictable costs for creators and bootcamps.</p>
        </div>

        {/* 3-Tier Cards with stagger animations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* HOBBY Tier */}
          <div className={`bg-gray-800/50 border border-gray-700 rounded-2xl p-6 hover:bg-gray-800/70 transition-all duration-500 hover:transform hover:scale-105 hover:shadow-xl group ${isVisible ? 'opacity-100 translate-y-0 animate-slide-up' : 'opacity-0 translate-y-8'}`} style={{ animationDelay: '200ms' }}>
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold mb-2 group-hover:text-blue-300 transition-colors">HOBBY</h3>
              <p className="text-xs text-gray-400 mb-3">Testing & Personal Blogs</p>
              <div className="text-2xl font-bold mb-3 group-hover:scale-105 transition-transform">$0<span className="text-sm text-gray-400">/month</span></div>
            </div>
            
            <ul className="space-y-2 mb-6 text-xs">
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <span className="text-gray-300"><strong>500</strong> executions/month</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <span className="text-gray-300">5 AI generations/month</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <span className="text-gray-300">10 capsules storage</span>
              </li>
              <li className="flex items-start">
                <span className="text-gray-400 mr-2">•</span>
                <span className="text-gray-400">DevCapsules watermark</span>
              </li>
              <li className="flex items-start">
                <span className="text-gray-400 mr-2">•</span>
                <span className="text-gray-400">Community support</span>
              </li>
            </ul>
            
            <Link href="/signup" className="block w-full bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg font-semibold text-sm transition-colors text-center">
              Start Free
            </Link>
          </div>

          {/* CREATOR Tier (Best Value) */}
          <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-blue-500 rounded-2xl p-6 relative hover:from-blue-500/30 hover:to-purple-500/30 transition-colors transform scale-105">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-gradient-to-r from-blue-500 to-purple-500 px-3 py-1 rounded-full text-xs font-semibold">
                ⭐ Best Value
              </span>
            </div>
            
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold mb-2">CREATOR</h3>
              <p className="text-xs text-gray-300 mb-3">Course Creators & Writers</p>
              <div className="text-2xl font-bold mb-3">$19<span className="text-sm text-gray-400">/month</span></div>
            </div>
            
            <ul className="space-y-2 mb-6 text-xs">
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <span className="text-white font-medium"><strong>10,000</strong> executions/month</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <span className="text-white font-medium">Unlimited AI generations</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <span className="text-gray-300">Unlimited capsules</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <span className="text-gray-300">White label (no logo)</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <span className="text-gray-300">Email support</span>
              </li>
            </ul>
            
            <Link href="/signup" className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-4 py-2 rounded-lg font-semibold text-sm transition-all transform hover:scale-105 shadow-lg shadow-blue-500/25 text-center">
              Start 14-Day Trial
            </Link>
          </div>

          {/* BUSINESS Tier */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 hover:bg-gray-800/70 transition-colors">
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold mb-2">BUSINESS</h3>
              <p className="text-xs text-gray-400 mb-3">Bootcamps & Academies</p>
              <div className="text-2xl font-bold mb-3">$99<span className="text-sm text-gray-400">/month</span></div>
            </div>
            
            <ul className="space-y-2 mb-6 text-xs">
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <span className="text-gray-300"><strong>100,000</strong> executions/month</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <span className="text-gray-300">Unlimited AI generations</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <span className="text-gray-300">Unlimited capsules</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <span className="text-gray-300">White label + custom domain</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <span className="text-gray-300">Priority Slack support</span>
              </li>
            </ul>
            
            <Link href="/contact" className="block w-full bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-semibold text-sm transition-colors text-center">
              Contact Sales
            </Link>
          </div>
        </div>

        {/* Money-Back Guarantee */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center bg-green-500/20 border border-green-500/30 rounded-full px-6 py-3">
            <span className="text-2xl mr-3">🛡️</span>
            <div>
              <div className="font-semibold text-green-400">30-Day Money-Back Guarantee</div>
              <div className="text-sm text-gray-300">If your engagement doesn't improve, we'll refund 100%. No questions asked.</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}