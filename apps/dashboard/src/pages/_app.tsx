import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import Head from "next/head";
import "../styles/globals.css";
import Layout from "../components/Layout";
import { AuthProvider } from "../contexts/AuthContext";
import { APIProvider } from "../contexts/APIContext";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  
  // Pages that should NOT use the main Layout (they have their own navigation)
  const noLayoutPages = ['/', '/login', '/signup', '/auth/callback', '/editor'];
  const isBlogPage = router.pathname.startsWith('/blog');
  const shouldUseLayout = !noLayoutPages.includes(router.pathname) && !isBlogPage;

  return (
    <>
      <Head>
        {/* Global defaults that can be overridden by individual pages */}
        <title>Devcapsules - Interactive Coding Platform</title>
        <meta name="description" content="AI-powered interactive coding platform for creating executable programming tutorials and embedded code widgets." />
        <meta name="keywords" content="devcapsules, dev capsules, interactive coding, developer education, programming tutorials, code execution, educational technology" />
        <meta name="author" content="Devcapsules Team" />
        
        {/* Proper Favicon Setup */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
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
      
      <AuthProvider>
        <APIProvider>
          {shouldUseLayout ? (
            <Layout>
              <Component {...pageProps} />
            </Layout>
          ) : (
            <Component {...pageProps} />
          )}
        </APIProvider>
      </AuthProvider>
    </>
  );
}