import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import "../styles/globals.css";
import Layout from "../components/Layout";
import { AuthProvider } from "../contexts/AuthContext";
import { APIProvider } from "../contexts/APIContext";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  
  // Pages that should NOT use the main Layout (they have their own navigation)
  const noLayoutPages = ['/', '/login', '/signup', '/auth/callback', '/editor'];
  const shouldUseLayout = !noLayoutPages.includes(router.pathname);

  return (
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
  );
}