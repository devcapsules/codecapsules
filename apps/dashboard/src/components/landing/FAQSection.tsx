import React, { useState } from 'react';
import Link from 'next/link';

export function FAQSection() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const faqs = [
    {
      question: "Can I embed this in GitHub READMEs?",
      answer: "Absolutely! Use our GitHub widget generator to create interactive demos right in your repository documentation."
    },
    {
      question: "Does this work with my LMS/documentation platform?",
      answer: "Yes! Works with Moodle, Canvas, GitBook, Notion, Confluence, and any platform that supports HTML embeds or iframes."
    },
    {
      question: "What programming languages are supported?",
      answer: "We currently support Python, JavaScript, Java, and SQL with full execution. C and C++ support is coming soon. Need another language? Just ask."
    },
    {
      question: "Is this secure?",
      answer: "Yes! All code runs in isolated sandbox containers with strict resource limits and timeouts. Your website and users are protected."
    },
    {
      question: "Can I customize the look and feel?",
      answer: "Absolutely! Match your brand colors, add your logo, and customize the interface. Team plans include full white-labeling options."
    },
    {
      question: "Do users need to create accounts?",
      answer: "Nope! They just click and code. Zero friction means higher engagement. Perfect for blog readers, course students, or doc users."
    }
  ];

  return (
    <section id="faq" className="py-16 lg:py-24 bg-[#04040a]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
            Common <span className="text-[#00ff87]">Questions</span>
          </h2>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <button
                className="w-full px-6 py-4 text-left flex justify-between items-center transition-colors hover:bg-white/[0.02]"
                onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
              >
                <span className="font-semibold text-white text-sm md:text-base">{faq.question}</span>
                <span className="text-slate-500 text-lg ml-4">
                  {openFAQ === index ? '−' : '+'}
                </span>
              </button>
              {openFAQ === index && (
                <div className="px-6 pb-4">
                  <p className="text-slate-400 text-sm leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Additional CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-400 mb-6 text-sm">
            Still have questions? We're here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="inline-block bg-[#00ff87] hover:bg-[#00ef77] text-black px-6 py-3 rounded-lg font-semibold text-sm transition-all transform hover:scale-105">
              Start Free Trial
            </Link>
            <button className="border border-gray-600 hover:border-gray-500 px-6 py-3 rounded-lg font-semibold text-sm transition-all hover:bg-gray-800/50">
              Schedule a Demo
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}