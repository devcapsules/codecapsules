import Head from 'next/head';
import { Navigation } from '../components/landing/Navigation';
import { Footer } from '../components/landing/Footer';
import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const faqs: FAQItem[] = [
    {
      category: 'general',
      question: 'What is Devcapsules?',
      answer: 'Devcapsules is an interactive coding platform that allows educators and content creators to build engaging, executable coding experiences. Students can run code directly in their browser, experiment with examples, and learn through hands-on practice.'
    },
    {
      category: 'general',
      question: 'Who can use Devcapsules?',
      answer: 'Devcapsules is designed for educators, coding bootcamps, online course creators, technical writers, and anyone who wants to create interactive coding content. Students and learners also benefit from the hands-on, executable examples.'
    },
    {
      category: 'features',
      question: 'What programming languages are supported?',
      answer: 'We support multiple programming languages including Python, JavaScript, Java, C#, Go, and SQL. Our platform runs code securely in isolated environments, providing instant feedback and results.'
    },
    {
      category: 'features',
      question: 'Can I embed Devcapsules in my website or blog?',
      answer: 'Yes! Devcapsules provides easy-to-use embed codes that allow you to integrate interactive coding examples directly into your website, blog, or learning management system.'
    },
    {
      category: 'features',
      question: 'Is there an API available?',
      answer: 'Yes, we provide a comprehensive API that allows you to programmatically create, manage, and execute coding capsules. This is perfect for integrating with existing educational platforms or building custom solutions.'
    },
    {
      category: 'pricing',
      question: 'Is Devcapsules free to use?',
      answer: 'We offer a free tier that includes basic features perfect for getting started. Premium plans are available for educators and organizations that need advanced features, analytics, and higher usage limits.'
    },
    {
      category: 'pricing',
      question: 'Do you offer discounts for educational institutions?',
      answer: 'Yes! We provide special pricing and discounts for schools, universities, and educational organizations. Contact us at education@devcapsules.com to learn more about our educational programs.'
    },
    {
      category: 'technical',
      question: 'How secure is code execution?',
      answer: 'Security is our top priority. All code runs in isolated, sandboxed environments with strict resource limits and timeout controls. We use containerization and other security measures to ensure safe execution.'
    },
    {
      category: 'technical',
      question: 'What are the system requirements?',
      answer: 'Devcapsules runs entirely in the browser - no installation required! It works on any modern web browser (Chrome, Firefox, Safari, Edge) on desktop, tablet, or mobile devices.'
    },
    {
      category: 'technical',
      question: 'Can I use Devcapsules offline?',
      answer: 'Currently, Devcapsules requires an internet connection to execute code and sync content. However, we\'re exploring offline capabilities for future releases.'
    },
    {
      category: 'support',
      question: 'How do I get help if I\'m stuck?',
      answer: 'We offer multiple support channels: comprehensive documentation, video tutorials, community forums, and direct email support. Premium users also get priority support with faster response times.'
    },
    {
      category: 'support',
      question: 'Can I migrate content from other platforms?',
      answer: 'Yes! We provide migration tools and support to help you transition from other coding platforms. Our team can assist with bulk imports and content conversion.'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Questions' },
    { id: 'general', name: 'General' },
    { id: 'features', name: 'Features' },
    { id: 'pricing', name: 'Pricing' },
    { id: 'technical', name: 'Technical' },
    { id: 'support', name: 'Support' }
  ];

  const filteredFaqs = activeCategory === 'all' 
    ? faqs 
    : faqs.filter(faq => faq.category === activeCategory);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <>
      <Head>
        <title>Frequently Asked Questions | Devcapsules</title>
        <meta name="description" content="Find answers to common questions about Devcapsules - the interactive coding platform." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <Navigation />
        
        <main className="pt-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Frequently Asked Questions
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Find answers to common questions about Devcapsules. Can't find what you're looking for? 
                <a href="/contact" className="text-blue-400 hover:text-blue-300 ml-1">Contact us</a>.
              </p>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap justify-center gap-2 mb-12">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeCategory === category.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {/* FAQ Items */}
            <div className="space-y-4">
              {filteredFaqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-700/30 transition-colors"
                  >
                    <h3 className="text-lg font-semibold text-white pr-4">
                      {faq.question}
                    </h3>
                    <svg
                      className={`w-5 h-5 text-gray-400 transform transition-transform ${
                        openIndex === index ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openIndex === index && (
                    <div className="px-6 pb-4">
                      <div className="pt-2 border-t border-gray-700">
                        <p className="text-gray-300 leading-relaxed mt-2">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Contact CTA */}
            <div className="mt-16 text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">Still have questions?</h2>
              <p className="text-blue-100 mb-6">
                Our team is here to help! Reach out to us and we'll get back to you as soon as possible.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="/contact" 
                  className="inline-flex items-center justify-center px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Contact Support
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
                <a 
                  href="mailto:hello@devcapsules.com" 
                  className="inline-flex items-center justify-center px-6 py-3 border border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
                >
                  Email Us
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}