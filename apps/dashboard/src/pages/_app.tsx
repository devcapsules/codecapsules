import type { AppProps } from "next/app";
import { useEffect, useState } from 'react';
import { useRouter } from "next/router";
import Head from "next/head";
import "../styles/globals.css";
import Layout from "../components/Layout";
import LearnerLayout from "../components/LearnerLayout";
import { AuthProvider } from "../contexts/AuthContext";
import { APIProvider } from "../contexts/APIContext";
import { AnimationProvider } from "../context/AnimationContext";

const LEARNER_HOSTNAME = 'learn.devcapsules.com';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [isLearnerDomain, setIsLearnerDomain] = useState(false);

  // ── Phase 2: Subdomain routing lock ──────────────────────────────────────
  // learn.devcapsules.com  → only /learn/* routes; everything else → /learn/capsules
  // devcapsules.com        → /learn/* routes → https://learn.devcapsules.com…
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hostname = window.location.hostname;
    const onLearnerDomain = hostname === LEARNER_HOSTNAME;
    setIsLearnerDomain(onLearnerDomain);

    // Allow auth-related routes on the learner domain (login, signup, callback)
    const isAuthRoute = ['/login', '/signup', '/auth'].some(p => router.pathname.startsWith(p));
    if (onLearnerDomain && !router.pathname.startsWith('/learn') && !isAuthRoute) {
      // Lock learner subdomain to /learn/* only (auth routes exempted)
      router.replace('/learn/capsules');
      return;
    }

    const isLocalDev = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.localhost');
    if (!onLearnerDomain && !isLocalDev && router.pathname.startsWith('/learn')) {
      // Redirect creator-domain /learn/* traffic to the learner subdomain
      window.location.href = `https://${LEARNER_HOSTNAME}${router.asPath}`;
    }
  }, [router.pathname, router.asPath]);

  // Scroll-reveal: observe .reveal and .reveal-stagger elements
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in-view');
          obs.unobserve(e.target);
        }
      }),
      { threshold: 0.07, rootMargin: '0px 0px -48px 0px' }
    );
    const observe = () => {
      setTimeout(() => {
        document.querySelectorAll('.reveal, .reveal-stagger').forEach(el => obs.observe(el));
      }, 120);
    };
    observe();
    router.events.on('routeChangeComplete', observe);
    return () => { obs.disconnect(); router.events.off('routeChangeComplete', observe); };
  }, [router.events]);
  
  // Pages that should NOT use the main Layout (they have their own navigation)
  const noLayoutPages = ['/', '/login', '/signup', '/auth/callback', '/editor'];
  const isBlogPage = router.pathname.startsWith('/blog');
  const isLearnerPage = router.pathname.startsWith('/learn');
  // Learner layout whenever on the learner subdomain OR on a /learn/* path
  const shouldUseLearnerLayout = isLearnerPage || isLearnerDomain;
  const shouldUseCreatorLayout = !shouldUseLearnerLayout && !noLayoutPages.includes(router.pathname) && !isBlogPage;

  return (
    <>
      <Head>
        {/* Global defaults that can be overridden by individual pages */}
        <title>Devcapsules - Interactive Coding Platform</title>
        <meta name="description" content="Interactive coding platform powered by EdGE for creating executable programming tutorials and embedded code widgets." />
        <meta name="keywords" content="devcapsules, dev capsules, interactive coding, developer education, programming tutorials, code execution, educational technology" />
        <meta name="author" content="Devcapsules Team" />
        
        {/* Proper Favicon Setup */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Brand Recognition */}
        <meta property="og:site_name" content="Devcapsules" />
        <meta name="application-name" content="Devcapsules" />
        <meta name="apple-mobile-web-app-title" content="Devcapsules" />
      </Head>
      
      <AnimationProvider>
      <AuthProvider>
        <APIProvider>
          {shouldUseLearnerLayout ? (
            <LearnerLayout>
              <Component {...pageProps} />
            </LearnerLayout>
          ) : shouldUseCreatorLayout ? (
            <Layout>
              <Component {...pageProps} />
            </Layout>
          ) : (
            <Component {...pageProps} />
          )}
        </APIProvider>
      </AuthProvider>
      </AnimationProvider>
    </>
  );
}