import React from 'react';
import Link from 'next/link';

const tiers = [
  {
    name: 'HOBBY',
    sub: 'Testing & Personal Blogs',
    price: '$0',
    period: '/month',
    cta: 'Start Free',
    href: '/signup',
    featured: false,
    features: [
      { text: '500 executions/month', included: true },
      { text: '5 AI generations/month', included: true },
      { text: '10 capsules storage', included: true },
      { text: 'DevCapsules watermark', included: false },
      { text: 'Community support', included: true },
    ],
  },
  {
    name: 'CREATOR',
    sub: 'Course Creators & Writers',
    price: '$19',
    period: '/month',
    cta: 'Start 14-Day Trial',
    href: '/signup',
    featured: true,
    badge: '⭐ Best Value',
    features: [
      { text: '10,000 executions/month', included: true },
      { text: '100 AI generations/month', included: true },
      { text: 'Unlimited capsules storage', included: true },
      { text: 'White label (no logo)', included: true },
      { text: 'Email support', included: true },
    ],
  },
  {
    name: 'BUSINESS',
    sub: 'Bootcamps & Academies',
    price: '$149',
    period: '/month',
    cta: 'Contact Sales',
    href: '/contact',
    featured: false,
    features: [
      { text: '100,000 executions/month', included: true },
      { text: '500 AI generations/month', included: true },
      { text: 'Unlimited capsules storage', included: true },
      { text: 'White label + custom domain', included: true },
      { text: 'Priority Slack support', included: true },
    ],
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-14 lg:py-20 bg-[#04040a] relative overflow-hidden">
      {/* Subtle orb */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(0,255,135,0.06) 0%, transparent 70%)', filter: 'blur(60px)' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Simple Pricing.{' '}
            <span style={{ color: '#00ff87' }}>Pay Only When Code Runs.</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto">
            No &ldquo;per student&rdquo; fees. Predictable costs for creators and bootcamps.
          </p>
        </div>

        {/* Cards */}
        <div className="reveal-stagger grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className="feat-card rounded-2xl p-6 flex flex-col transition-all duration-300 relative"
              style={{
                background: tier.featured
                  ? 'linear-gradient(135deg, rgba(0,255,135,0.08) 0%, rgba(0,200,100,0.04) 100%)'
                  : 'rgba(255,255,255,0.03)',
                border: tier.featured
                  ? '1.5px solid rgba(0,255,135,0.4)'
                  : '1px solid rgba(255,255,255,0.07)',
                boxShadow: tier.featured ? '0 0 40px rgba(0,255,135,0.12), 0 0 0 1px rgba(0,255,135,0.1) inset' : 'none',
                transform: tier.featured ? 'translateY(-4px)' : 'none',
              }}
            >
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="text-xs font-semibold px-3 py-1 rounded-full"
                    style={{ background: 'rgba(0,255,135,0.15)', border: '1px solid rgba(0,255,135,0.3)', color: '#00ff87' }}>
                    {tier.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-sm font-bold tracking-widest mb-1"
                  style={{ color: tier.featured ? '#00ff87' : '#94a3b8' }}>
                  {tier.name}
                </h3>
                <p className="text-xs text-slate-500 mb-4">{tier.sub}</p>
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-bold text-white">{tier.price}</span>
                  <span className="text-slate-400 text-sm mb-1">{tier.period}</span>
                </div>
              </div>

              <ul className="space-y-2.5 mb-8 flex-1">
                {tier.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    {f.included ? (
                      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="7" fill="rgba(0,255,135,0.15)" stroke="rgba(0,255,135,0.4)" strokeWidth="1"/>
                        <path d="M5 8l2 2 4-4" stroke="#00ff87" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="7" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
                        <path d="M5.5 8h5" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    )}
                    <span className={f.included ? 'text-slate-300' : 'text-slate-600'}>{f.text}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={tier.href}
                className="block w-full text-center py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                style={tier.featured ? {
                  background: '#00ff87',
                  color: '#04040a',
                } : {
                  background: 'rgba(255,255,255,0.06)',
                  color: '#e2e8f0',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Money-Back Guarantee */}
        <div className="text-center mt-10">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full"
            style={{ background: 'rgba(0,255,135,0.07)', border: '1px solid rgba(0,255,135,0.15)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00ff87" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
            <span className="text-sm font-medium" style={{ color: '#00ff87' }}>30-Day Money-Back Guarantee</span>
            <span className="text-sm text-slate-400 hidden sm:inline">&mdash; 100% refund if you&rsquo;re not satisfied.</span>
          </div>
        </div>
      </div>
    </section>
  );
}