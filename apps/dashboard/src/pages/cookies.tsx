import Head from 'next/head';
import { Navigation } from '../components/landing/Navigation';
import { Footer } from '../components/landing/Footer';

export default function Cookies() {
  return (
    <>
      <Head>
        <title>Cookie Policy | Devcapsules</title>
        <meta name="description" content="Learn about how Devcapsules uses cookies and similar technologies to enhance your experience." />
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
                Cookie Policy
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                This policy explains how Devcapsules uses cookies and similar technologies to provide and improve our services.
              </p>
              <p className="text-sm text-gray-400 mt-4">
                Last updated: November 19, 2025
              </p>
            </div>

            <div className="prose prose-invert prose-blue max-w-none">
              <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700 space-y-8">
                
                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">1. What Are Cookies?</h2>
                  <div className="text-gray-300 space-y-4">
                    <p>
                      Cookies are small text files that are stored on your device when you visit a website. 
                      They help websites remember information about your visit, such as your preferences and login status.
                    </p>
                    <p>
                      Similar technologies include local storage, session storage, and other browser storage mechanisms 
                      that serve similar purposes to cookies.
                    </p>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">2. How We Use Cookies</h2>
                  <div className="text-gray-300 space-y-4">
                    <p>Devcapsules uses cookies and similar technologies to:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Keep you logged in to your account</li>
                      <li>Remember your preferences and settings</li>
                      <li>Provide personalized coding experiences</li>
                      <li>Analyze how our platform is used to improve our services</li>
                      <li>Ensure security and prevent fraud</li>
                      <li>Deliver relevant content and features</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">3. Types of Cookies We Use</h2>
                  <div className="text-gray-300 space-y-6">
                    
                    <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600">
                      <h3 className="text-lg font-semibold text-white mb-3">Essential Cookies</h3>
                      <p className="mb-3">These cookies are necessary for the website to function properly and cannot be disabled.</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Authentication and login status</li>
                        <li>Security tokens and CSRF protection</li>
                        <li>Session management for code execution</li>
                        <li>Load balancing and server routing</li>
                      </ul>
                    </div>

                    <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600">
                      <h3 className="text-lg font-semibold text-white mb-3">Functional Cookies</h3>
                      <p className="mb-3">These cookies enable enhanced functionality and personalization.</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>User preferences and settings</li>
                        <li>Language and region settings</li>
                        <li>Theme and display preferences</li>
                        <li>Recently viewed content</li>
                      </ul>
                    </div>

                    <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600">
                      <h3 className="text-lg font-semibold text-white mb-3">Analytics Cookies</h3>
                      <p className="mb-3">These cookies help us understand how users interact with our platform.</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Usage statistics and page views</li>
                        <li>Feature usage and interaction patterns</li>
                        <li>Performance monitoring</li>
                        <li>Error tracking and debugging</li>
                      </ul>
                    </div>

                    <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600">
                      <h3 className="text-lg font-semibold text-white mb-3">Performance Cookies</h3>
                      <p className="mb-3">These cookies help optimize the performance of our platform.</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Code execution optimization</li>
                        <li>Content delivery network (CDN) preferences</li>
                        <li>Resource loading optimization</li>
                        <li>Caching preferences</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">4. Third-Party Cookies</h2>
                  <div className="text-gray-300 space-y-4">
                    <p>We may use third-party services that set their own cookies:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li><strong>Analytics Services:</strong> To understand user behavior and improve our platform</li>
                      <li><strong>Authentication Providers:</strong> For secure login via third-party services</li>
                      <li><strong>Content Delivery Networks:</strong> To deliver content efficiently</li>
                      <li><strong>Payment Processors:</strong> For handling subscription payments securely</li>
                    </ul>
                    <p>
                      These third parties have their own privacy policies and cookie practices. We recommend 
                      reviewing their policies to understand how they use cookies.
                    </p>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">5. Cookie Duration</h2>
                  <div className="text-gray-300 space-y-4">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600">
                        <h3 className="text-lg font-semibold text-white mb-2">Session Cookies</h3>
                        <p className="text-sm">
                          Temporary cookies that are deleted when you close your browser. 
                          Used for essential functionality during your visit.
                        </p>
                      </div>
                      <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600">
                        <h3 className="text-lg font-semibold text-white mb-2">Persistent Cookies</h3>
                        <p className="text-sm">
                          Remain on your device for a set period or until you delete them. 
                          Used to remember your preferences across visits.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">6. Managing Cookie Preferences</h2>
                  <div className="text-gray-300 space-y-4">
                    <h3 className="text-lg font-semibold text-white">Browser Settings</h3>
                    <p>You can control cookies through your browser settings:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Accept or reject cookies from all websites</li>
                      <li>Accept or reject cookies from specific websites</li>
                      <li>Delete existing cookies from your device</li>
                      <li>Receive notifications when websites try to set cookies</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-white mt-6">Popular Browser Cookie Settings</h3>
                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                      <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600">
                        <h4 className="font-semibold text-white mb-2">Chrome</h4>
                        <p className="text-sm">Settings → Privacy and Security → Cookies and other site data</p>
                      </div>
                      <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600">
                        <h4 className="font-semibold text-white mb-2">Firefox</h4>
                        <p className="text-sm">Settings → Privacy & Security → Cookies and Site Data</p>
                      </div>
                      <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600">
                        <h4 className="font-semibold text-white mb-2">Safari</h4>
                        <p className="text-sm">Preferences → Privacy → Manage Website Data</p>
                      </div>
                      <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600">
                        <h4 className="font-semibold text-white mb-2">Edge</h4>
                        <p className="text-sm">Settings → Cookies and site permissions → Manage and delete cookies</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">7. Impact of Disabling Cookies</h2>
                  <div className="text-gray-300 space-y-4">
                    <p>Disabling cookies may affect your experience on Devcapsules:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>You may need to log in repeatedly</li>
                      <li>Your preferences and settings may not be saved</li>
                      <li>Some features may not work properly</li>
                      <li>Code execution sessions may not persist</li>
                      <li>Personalized experiences may be limited</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">8. Mobile Devices</h2>
                  <div className="text-gray-300 space-y-4">
                    <p>
                      On mobile devices, cookie management works similarly to desktop browsers. 
                      You can usually find cookie settings in your mobile browser's privacy or security settings.
                    </p>
                    <p>
                      Mobile apps may use different tracking technologies. Please refer to your device's 
                      privacy settings to manage app-level tracking preferences.
                    </p>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">9. Updates to This Policy</h2>
                  <div className="text-gray-300 space-y-4">
                    <p>
                      We may update this Cookie Policy from time to time to reflect changes in technology, 
                      regulation, or our practices. We will notify you of significant changes through our 
                      platform or via email.
                    </p>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">10. Contact Us</h2>
                  <div className="text-gray-300 space-y-4">
                    <p>If you have questions about our use of cookies, please contact us:</p>
                    <ul className="list-none space-y-2 ml-4">
                      <li>Email: <a href="mailto:privacy@devcapsules.com" className="text-blue-400 hover:text-blue-300">privacy@devcapsules.com</a></li>
                      <li>General inquiries: <a href="mailto:hello@devcapsules.com" className="text-blue-400 hover:text-blue-300">hello@devcapsules.com</a></li>
                      <li>Contact form: <a href="/contact" className="text-blue-400 hover:text-blue-300">devcapsules.com/contact</a></li>
                    </ul>
                  </div>
                </section>

              </div>
            </div>

            <div className="mt-12 p-6 bg-green-600/20 border border-green-500/30 rounded-xl">
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Your Control</h3>
                  <p className="text-gray-300">
                    You have full control over your cookie preferences. We respect your choices and strive 
                    to provide a great experience regardless of your cookie settings. Essential cookies 
                    required for basic functionality will always be necessary for the platform to work properly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}