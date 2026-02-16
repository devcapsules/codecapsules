import Head from 'next/head';
import { Navigation } from '../components/landing/Navigation';
import { Footer } from '../components/landing/Footer';

export default function Terms() {
  return (
    <>
      <Head>
        <title>Terms of Service | Devcapsules</title>
        <meta name="description" content="Read our terms of service to understand the rules and guidelines for using Devcapsules." />
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
                Terms of Service
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Please read these terms carefully before using Devcapsules. By using our service, you agree to these terms.
              </p>
              <p className="text-sm text-gray-400 mt-4">
                Last updated: November 19, 2025
              </p>
            </div>

            <div className="prose prose-invert prose-blue max-w-none">
              <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700 space-y-8">
                
                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
                  <div className="text-gray-300 space-y-4">
                    <p>
                      By accessing or using Devcapsules ("the Service"), you agree to be bound by these Terms of Service 
                      ("Terms"). If you do not agree to these Terms, you may not use our Service.
                    </p>
                    <p>
                      These Terms apply to all users of the Service, including educators, students, developers, 
                      and organizations.
                    </p>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">2. Description of Service</h2>
                  <div className="text-gray-300 space-y-4">
                    <p>
                      Devcapsules is an interactive coding platform that enables users to create, share, and execute 
                      coding experiences directly in the browser. Our Service includes:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Interactive coding environments for multiple programming languages</li>
                      <li>Code execution and testing capabilities</li>
                      <li>Content creation and sharing tools</li>
                      <li>Embedding functionality for external websites</li>
                      <li>Analytics and progress tracking features</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">3. User Accounts and Registration</h2>
                  <div className="text-gray-300 space-y-4">
                    <p>To access certain features, you must create an account by providing:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Accurate and complete registration information</li>
                      <li>A valid email address</li>
                      <li>A secure password</li>
                    </ul>
                    <p>You are responsible for:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Maintaining the confidentiality of your account credentials</li>
                      <li>All activities that occur under your account</li>
                      <li>Notifying us immediately of any unauthorized use</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">4. Acceptable Use Policy</h2>
                  <div className="text-gray-300 space-y-4">
                    <p>You agree NOT to use the Service to:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Execute malicious code or attempt to breach security measures</li>
                      <li>Violate any applicable laws or regulations</li>
                      <li>Infringe on intellectual property rights of others</li>
                      <li>Harass, abuse, or harm other users</li>
                      <li>Distribute spam, viruses, or malicious content</li>
                      <li>Attempt to reverse engineer or compromise our systems</li>
                      <li>Use the Service for cryptocurrency mining or similar resource-intensive activities</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">5. Content and Intellectual Property</h2>
                  <div className="text-gray-300 space-y-4">
                    <h3 className="text-lg font-semibold text-white">Your Content</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>You retain ownership of original content you create</li>
                      <li>You grant us a license to host, display, and distribute your public content</li>
                      <li>You are responsible for ensuring you have rights to any content you upload</li>
                      <li>You warrant that your content does not violate third-party rights</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-white mt-6">Our Content</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>The Devcapsules platform, software, and documentation are our property</li>
                      <li>You may not copy, modify, or redistribute our proprietary technology</li>
                      <li>Our trademarks and branding remain our exclusive property</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">6. Code Execution and Security</h2>
                  <div className="text-gray-300 space-y-4">
                    <p>
                      Code execution is provided in sandboxed environments with security limitations:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Execution time and resource limits apply</li>
                      <li>Network access and file system operations are restricted</li>
                      <li>We reserve the right to terminate long-running or resource-intensive processes</li>
                      <li>Code that violates security policies will be blocked or removed</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">7. Privacy and Data Protection</h2>
                  <div className="text-gray-300 space-y-4">
                    <p>
                      Your privacy is important to us. Our data collection and use practices are detailed 
                      in our <a href="/privacy" className="text-blue-400 hover:text-blue-300">Privacy Policy</a>, 
                      which is incorporated into these Terms by reference.
                    </p>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">8. Subscription and Payment Terms</h2>
                  <div className="text-gray-300 space-y-4">
                    <h3 className="text-lg font-semibold text-white">Free and Paid Plans</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Free plans include basic features with usage limitations</li>
                      <li>Paid subscriptions provide additional features and higher limits</li>
                      <li>Subscription fees are billed in advance on a recurring basis</li>
                      <li>You may cancel your subscription at any time</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-white mt-6">Billing and Refunds</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>All fees are non-refundable except as required by law</li>
                      <li>We may offer prorated refunds at our discretion</li>
                      <li>Failed payments may result in service suspension</li>
                      <li>Price changes will be communicated in advance</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">9. Service Availability and Modifications</h2>
                  <div className="text-gray-300 space-y-4">
                    <p>We strive to provide reliable service, but:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>We do not guarantee 100% uptime or availability</li>
                      <li>Scheduled maintenance may temporarily interrupt service</li>
                      <li>We may modify features or discontinue services with notice</li>
                      <li>Emergency maintenance may occur without advance notice</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">10. Termination</h2>
                  <div className="text-gray-300 space-y-4">
                    <p>Either party may terminate these Terms:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>You may delete your account at any time</li>
                      <li>We may suspend or terminate accounts for Terms violations</li>
                      <li>We may discontinue the Service with reasonable notice</li>
                      <li>Termination does not relieve you of payment obligations</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">11. Disclaimers and Limitation of Liability</h2>
                  <div className="text-gray-300 space-y-4">
                    <p>THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND.</p>
                    <p>We disclaim all warranties, including:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Merchantability and fitness for a particular purpose</li>
                      <li>Accuracy or reliability of code execution results</li>
                      <li>Continuous or error-free operation</li>
                      <li>Security against all possible threats</li>
                    </ul>
                    <p>
                      Our liability is limited to the maximum extent permitted by law. In no event shall 
                      our total liability exceed the amount you paid us in the 12 months preceding the claim.
                    </p>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">12. Indemnification</h2>
                  <div className="text-gray-300 space-y-4">
                    <p>
                      You agree to indemnify and hold us harmless from claims arising from your use of 
                      the Service, violation of these Terms, or infringement of third-party rights.
                    </p>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">13. Governing Law and Disputes</h2>
                  <div className="text-gray-300 space-y-4">
                    <p>
                      These Terms are governed by the laws of [Jurisdiction]. Any disputes will be resolved 
                      through binding arbitration or in the courts of [Jurisdiction].
                    </p>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">14. Changes to Terms</h2>
                  <div className="text-gray-300 space-y-4">
                    <p>
                      We may modify these Terms at any time. Significant changes will be communicated 
                      via email or platform notification. Continued use of the Service constitutes 
                      acceptance of modified Terms.
                    </p>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">15. Contact Information</h2>
                  <div className="text-gray-300 space-y-4">
                    <p>For questions about these Terms, contact us:</p>
                    <ul className="list-none space-y-2 ml-4">
                      <li>Email: <a href="mailto:legal@devcapsules.com" className="text-blue-400 hover:text-blue-300">legal@devcapsules.com</a></li>
                      <li>General inquiries: <a href="mailto:hello@devcapsules.com" className="text-blue-400 hover:text-blue-300">hello@devcapsules.com</a></li>
                      <li>Contact form: <a href="/contact" className="text-blue-400 hover:text-blue-300">devcapsules.com/contact</a></li>
                    </ul>
                  </div>
                </section>

              </div>
            </div>

            <div className="mt-12 p-6 bg-amber-600/20 border border-amber-500/30 rounded-xl">
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Important Notice</h3>
                  <p className="text-gray-300">
                    By using Devcapsules, you acknowledge that you have read, understood, and agree to be bound by 
                    these Terms of Service. If you do not agree with any part of these terms, please discontinue 
                    use of our Service.
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