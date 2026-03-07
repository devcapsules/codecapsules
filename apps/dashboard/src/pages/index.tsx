import React from 'react';
import Head from 'next/head';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { Navigation } from '../components/landing/Navigation';
import { HeroSection } from '../components/landing/HeroSection';
import { LanguageMarquee } from '../components/landing/LanguageMarquee';
import { ValuePropsSection } from '../components/landing/ValuePropsSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { SocialProofSection } from '../components/landing/SocialProofSection';
import { ComparisonSection } from '../components/landing/ComparisonSection';
import { PricingSection } from '../components/landing/PricingSection';
import { FAQSection } from '../components/landing/FAQSection';
import { CTASection } from '../components/landing/CTASection';
import { Footer } from '../components/landing/Footer';
import DemoVideoSection from '../components/landing/DemoVideoSection';
import { CurriculumSection } from '../components/landing/CurriculumSection';
import { EdgeAssistantShowcase } from '../components/landing/EdgeAssistantShowcase';
import { EdgeForgeShowcase } from '../components/landing/EdgeForgeShowcase';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is authenticated, redirect them to their appropriate dashboard
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // IMPORTANT: Always render the landing page for SEO
  // The redirect happens client-side via useEffect for authenticated users
  // This ensures crawlers see the full homepage content
  return (
    <>
      <Head>
        <title>Devcapsules - Interactive Coding Platform | EdGE-Powered Code Tutorials & Live Execution</title>
        <meta 
          name="description" 
          content="Devcapsules (dev capsules) is an interactive coding platform for creating EdGE-powered programming tutorials with live code execution. Build executable code widgets for Python, Java, SQL, JavaScript. Software development education platform - not pharmaceutical products." 
        />
        <meta name="keywords" content="devcapsules, dev capsules, dev capsules coding, dev capsules programming, devcapsules.com, interactive coding platform, EdGE Forge code tutorials, live code execution, programming education, online code editor, developer tools, embed code widgets, Python tutorials, Java tutorials, SQL tutorials, JavaScript playground, coding sandbox, code execution platform, learn programming online, software development education, dev capsules code editor, dev capsules interactive tutorials" />
        <meta name="author" content="Devcapsules Team" />
        <meta name="creator" content="Devcapsules" />
        <meta name="publisher" content="Devcapsules" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow" />
        <link rel="canonical" href="https://devcapsules.com" />
        
        {/* Business and Brand Information */}
        <meta name="rating" content="General" />
        <meta name="distribution" content="Global" />
        <meta name="language" content="EN" />
        <meta name="copyright" content="Devcapsules 2024" />
        
        {/* Google Search Console and verification */}
        <meta name="google-site-verification" content="your-verification-code" />
        <meta name="theme-color" content="#1e293b" />
        <meta name="color-scheme" content="dark light" />
        
        {/* Additional brand signals for Google */}
        <meta property="og:logo" content="https://devcapsules.com/logo.png" />
        <meta name="thumbnail" content="https://devcapsules.com/logo.png" />
        <link rel="image_src" href="https://devcapsules.com/logo.png" />
        
        {/* Preload critical resources */}
        <link rel="preload" href="/logo.png" as="image" type="image/png" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        
        {/* Additional SEO meta tags */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Devcapsules" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://devcapsules.com" />
        <meta property="og:title" content="Devcapsules: Create Interactive Coding Tutorials with EdGE" />
        <meta property="og:description" content="🚀 Transform your coding tutorials with EdGE Forge! Create interactive, executable code widgets for Python, Java, SQL & more. Embed anywhere, execute live code, engage learners instantly." />
        <meta property="og:image" content="https://devcapsules.com/logo.png" />
        <meta property="og:image:width" content="600" />
        <meta property="og:image:height" content="60" />
        <meta property="og:image:alt" content="Devcapsules Logo" />
        <meta property="og:site_name" content="Devcapsules" />
        <meta property="og:locale" content="en_US" />
        
        {/* Google-specific meta tags for logo recognition */}
        <meta name="msapplication-TileImage" content="/logo.png" />
        <meta name="application-name" content="Devcapsules" />
        
        {/* Twitter Card - Enhanced for better social sharing */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://devcapsules.com" />
        <meta name="twitter:title" content="🚀 Devcapsules: Create Interactive Coding Tutorials with EdGE" />
        <meta name="twitter:description" content="Transform static code into engaging, executable tutorials! ✨ EdGE-powered platform for Python, Java, SQL, JavaScript & more. Join 50,000+ developers worldwide." />
        <meta name="twitter:image" content="https://devcapsules.com/images/devcapsules-hero.png" />
        <meta name="twitter:image:alt" content="Devcapsules Interactive Coding Platform Screenshot" />
        <meta name="twitter:site" content="@devcapsules" />
        <meta name="twitter:creator" content="@devcapsules" />
        <meta name="twitter:domain" content="devcapsules.com" />
        
        {/* Favicons - Proper favicon files for better SEO */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Additional logo meta tags for Google */}
        <meta name="msapplication-TileColor" content="#1e293b" />
        <meta name="apple-mobile-web-app-title" content="Devcapsules" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* Enhanced Schema.org structured data for better Google SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "@id": "https://devcapsules.com/#application",
              "name": "Devcapsules",
              "alternateName": ["Dev Capsules Coding Platform", "Devcapsules.com", "Dev Capsules Interactive IDE", "Dev Capsules Code Editor"],
              "url": "https://devcapsules.com",
              "sameAs": [
                "https://devcapsules.com",
                "https://www.devcapsules.com"
              ],
              "logo": {
                "@type": "ImageObject",
                "@id": "https://devcapsules.com/#logo",
                "url": "https://devcapsules.com/logo.png",
                "contentUrl": "https://devcapsules.com/logo.png",
                "width": 600,
                "height": 60,
                "caption": "Devcapsules Logo - EdGE-Powered Interactive Coding Platform"
              },
              "image": [
                "https://devcapsules.com/logo.png",
                "https://devcapsules.com/images/devcapsules-hero.png"
              ],
              "description": "🚀 Create interactive coding tutorials instantly! EdGE-powered platform with Python, Java, SQL, JavaScript, C#, and Linux Terminal execution. Transform static code into engaging, executable learning experiences.",
              "applicationCategory": ["EducationalApplication", "DeveloperTool", "WebApplication"],
              "applicationSubCategory": "Interactive Programming Education",
              "operatingSystem": ["Web Browser", "Cross-platform"],
              "browserRequirements": "Modern web browser with JavaScript enabled",
              "softwareVersion": "2.0.1",
              "releaseNotes": "Enhanced EdGE features, improved multi-language support, faster execution",
              "datePublished": "2024-01-01",
              "dateModified": "2025-12-21",
              "copyrightYear": 2024,
              "inLanguage": "en-US",
              "isAccessibleForFree": true,
              "publisher": {
                "@type": "Organization",
                "@id": "https://devcapsules.com/#organization",
                "name": "Devcapsules",
                "url": "https://devcapsules.com",
                "logo": {
                  "@id": "https://devcapsules.com/#logo"
                }
              },
              "creator": {
                "@id": "https://devcapsules.com/#organization"
              },
              "maintainer": {
                "@id": "https://devcapsules.com/#organization"
              },
              "offers": [
                {
                  "@type": "Offer",
                  "name": "Hobby Plan",
                  "price": "0",
                  "priceCurrency": "USD",
                  "availability": "https://schema.org/InStock",
                  "priceValidUntil": "2026-12-31",
                  "itemCondition": "https://schema.org/NewCondition",
                  "description": "500 executions/month, 5 EdGE Forge generations, 10 capsules"
                },
                {
                  "@type": "Offer", 
                  "name": "Creator Plan",
                  "price": "19",
                  "priceCurrency": "USD",
                  "availability": "https://schema.org/InStock",
                  "priceValidUntil": "2026-12-31",
                  "description": "10,000 executions/month, unlimited EdGE Forge generations, white label"
                },
                {
                  "@type": "Offer", 
                  "name": "Business Plan",
                  "price": "99",
                  "priceCurrency": "USD",
                  "availability": "https://schema.org/InStock",
                  "priceValidUntil": "2026-12-31",
                  "description": "100,000 executions/month, unlimited EdGE Forge, custom domain, priority support"
                }
              ],
              "featureList": [
                "✨ EdGE-Powered Tutorial Generation",
                "🐍 Interactive Python Code Execution",
                "☕ Java Programming Environment", 
                "🗄️ SQL Query Sandbox",
                "🌐 JavaScript Live Coding",
                "⚡ C# Development Tools",
                "🐧 Linux Terminal Simulation",
                "📱 Embeddable Code Widgets",
                "👥 Real-time Collaboration",
                "🚀 WebAssembly Performance",
                "📚 Educational Content Creation",
                "🎯 Multi-language Support"
              ],
              "screenshot": [
                "https://devcapsules.com/images/devcapsules-hero.png",
                "https://devcapsules.com/images/dashboard-screenshot.png"
              ],
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "ratingCount": "2847",
                "bestRating": "5",
                "worstRating": "1"
              },
              "review": [
                {
                  "@type": "Review",
                  "author": {
                    "@type": "Person",
                    "name": "Sarah Chen"
                  },
                  "reviewRating": {
                    "@type": "Rating",
                    "ratingValue": "5",
                    "bestRating": "5"
                  },
                  "reviewBody": "Devcapsules revolutionized my coding bootcamp! Students are 10x more engaged with interactive tutorials."
                }
              ],
              "keywords": [
                "interactive coding tutorials",
                "EdGE-powered programming education", 
                "live code execution",
                "embedded coding widgets",
                "Python tutorials",
                "Java programming",
                "SQL sandbox",
                "JavaScript playground",
                "developer education platform",
                "coding bootcamp tools"
              ]
            })
          }}
        />
        
        {/* WebSite + Organization structured data for Google brand recognition */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "@id": "https://devcapsules.com/#website", 
              "url": "https://devcapsules.com",
              "name": "Devcapsules - Interactive Coding Platform",
              "alternateName": "Devcapsules.com",
              "description": "Devcapsules is a software development education platform for creating interactive coding tutorials with live code execution. Build EdGE-powered programming widgets for Python, Java, SQL, JavaScript.",
              "inLanguage": "en-US",
              "publisher": {
                "@type": "Organization",
                "@id": "https://devcapsules.com/#organization",
                "name": "Devcapsules",
                "alternateName": ["Devcapsules.com", "Devcapsules Platform"],
                "url": "https://devcapsules.com",
                "logo": {
                  "@type": "ImageObject",
                  "@id": "https://devcapsules.com/#logo",
                  "url": "https://devcapsules.com/logo.png",
                  "contentUrl": "https://devcapsules.com/logo.png",
                  "width": 600,
                  "height": 60,
                  "caption": "Devcapsules Logo - EdGE-Powered Interactive Coding Platform",
                  "representativeOfPage": true
                },
                "image": {
                  "@id": "https://devcapsules.com/#logo"
                },
                "description": "Leading EdGE-powered platform for creating interactive coding tutorials and executable programming widgets used by educators, developers, and coding bootcamps worldwide",
                "foundingDate": "2024-01-01",
                "slogan": "Transform Static Code into Interactive Learning",
                "contactPoint": {
                  "@type": "ContactPoint",
                  "contactType": "customer service",
                  "email": "support@devcapsules.com",
                  "url": "https://devcapsules.com/contact",
                  "availableLanguage": ["English"],
                  "areaServed": "Worldwide"
                },
                "sameAs": [
                  "https://twitter.com/devcapsules",
                  "https://github.com/devcapsules",
                  "https://linkedin.com/company/devcapsules",
                  "https://youtube.com/@devcapsules"
                ],
                "knowsAbout": [
                  "Interactive Programming Education",
                  "EdGE-Powered Coding Tutorials", 
                  "Python Programming",
                  "Java Development",
                  "SQL Database Training",
                  "JavaScript Education",
                  "C# Programming",
                  "Linux Terminal Training",
                  "WebAssembly Technology",
                  "Developer Education Tools",
                  "Coding Bootcamp Resources",
                  "Educational Technology"
                ]
              },
              "potentialAction": [
                {
                  "@type": "SearchAction",
                  "target": {
                    "@type": "EntryPoint",
                    "urlTemplate": "https://devcapsules.com/search?q={search_term_string}"
                  },
                  "query-input": "required name=search_term_string"
                }
              ],
              "mainEntity": {
                "@id": "https://devcapsules.com/#application"
              }
            })
          }}
        />
      </Head>
      
      <div className="min-h-screen text-white relative overflow-x-hidden" style={{ background: '#04040a' }}>
        {/* Fixed page grid — shows through glassmorphism cards */}
        <div className="fixed inset-0 pointer-events-none select-none" aria-hidden="true" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          zIndex: 0,
        }} />
        <div className="relative" style={{ zIndex: 1 }}>
        <Navigation />
        <div className="pt-16">
        <HeroSection />
        <div className="reveal"><EdgeAssistantShowcase /></div>
        <div className="reveal"><DemoVideoSection /></div>
        <div className="reveal mt-12"><LanguageMarquee /></div>
        <div className="reveal"><SocialProofSection /></div>
        <div className="reveal" id="features"><FeaturesSection /></div>
        <div className="reveal"><EdgeForgeShowcase /></div>
        <div className="reveal"><ValuePropsSection /></div>
        <div className="reveal"><CurriculumSection /></div>
        <div className="reveal"><ComparisonSection /></div>
        <div className="reveal" id="pricing"><PricingSection /></div>
        <div className="reveal" id="faq"><FAQSection /></div>
        <div className="reveal"><CTASection /></div>
      </div>
      <Footer />
      </div>
      </div>
    </>
  );
}