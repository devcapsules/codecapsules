import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { Navigation } from '../components/landing/Navigation';
import { HeroSection } from '../components/landing/HeroSection';
import { ProblemSection } from '../components/landing/ProblemSection';
import { ValuePropsSection } from '../components/landing/ValuePropsSection';
import { SolutionSection } from '../components/landing/SolutionSection';
import { PlatformShowcaseSection } from '../components/landing/PlatformShowcaseSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { SocialProofSection } from '../components/landing/SocialProofSection';
import { ComparisonSection } from '../components/landing/ComparisonSection';
import { PricingSection } from '../components/landing/PricingSection';
import { FAQSection } from '../components/landing/FAQSection';
import { CTASection } from '../components/landing/CTASection';
import { Footer } from '../components/landing/Footer';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is authenticated, redirect them to their appropriate dashboard
    if (!loading && user) {
      const userCreatedAt = new Date(user.created_at);
      const now = new Date();
      const timeDiff = now.getTime() - userCreatedAt.getTime();
      const isNewUser = timeDiff < 300000; // Less than 5 minutes old = new user
      
      const redirectTo = isNewUser ? '/create-capsule' : '/dashboard';
      router.push(redirectTo);
    }
  }, [user, loading, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show landing page for unauthenticated users
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navigation />
      <div className="pt-16"> {/* Add padding for fixed navigation */}
        <HeroSection />
        <ProblemSection />
        <ValuePropsSection />
        <SolutionSection />
        <PlatformShowcaseSection />
        <div id="features">
          <FeaturesSection />
        </div>
        <SocialProofSection />
        <ComparisonSection />
        <div id="pricing">
          <PricingSection />
        </div>
        <div id="faq">
          <FAQSection />
        </div>
        <CTASection />
      </div>
      <Footer />
    </div>
  );
}