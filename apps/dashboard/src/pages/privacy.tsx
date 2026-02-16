import Head from 'next/head';
import { Navigation } from '../components/landing/Navigation';
import { Footer } from '../components/landing/Footer';

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Privacy Policy | Devcapsules</title>
        <meta name="description" content="Read our privacy policy to understand how Devcapsules collects, uses, and protects your data." />
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
                Privacy Policy
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Your privacy is important to us. This policy explains how we collect, use, and protect your information.
              </p>
              <p className="text-sm text-gray-400 mt-4">
                Last updated: November 19, 2025
              </p>
            </div>

            <div className="prose prose-invert prose-blue max-w-none">
              <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700 space-y-8">
                
                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">1. Information We Collect</h2>
                  <div className="text-gray-300 space-y-4">
                    <h3 className="text-lg font-semibold text-white">Personal Information</h3>
                    <p>When you create an account or use our services, we may collect:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Name and email address</li>
                      <li>Profile information you choose to provide</li>
                      <li>Educational institution or organization details</li>
                      <li>Communication preferences</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-white mt-6">Usage Information</h3>
                    <p>We automatically collect information about how you use our platform:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Code execution statistics and performance metrics</li>
                      <li>Feature usage patterns and interactions</li>
                      <li>Device information and browser type</li>
                      <li>IP address and general location data</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">2. How We Use Your Information</h2>
                  <div className="text-gray-300 space-y-4">
                    <p>We use the information we collect to:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Provide and improve our interactive coding platform</li>
                      <li>Process your code execution requests securely</li>
                      <li>Send important updates about our services</li>
                      <li>Provide customer support and respond to inquiries</li>
                      <li>Analyze usage patterns to enhance user experience</li>
                      <li>Ensure platform security and prevent abuse</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">3. Code and Content Privacy</h2>
                  <div className="text-gray-300 space-y-4">
                    <p>Your code and learning content are important to us:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Code you write is processed in secure, isolated environments</li>
                      <li>We do not store or analyze your private code permanently</li>
                      <li>Published capsules are stored to provide the service</li>
                      <li>You retain full ownership of your original content</li>
                      <li>Code execution logs are kept for security and debugging purposes only</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">4. Data Sharing and Disclosure</h2>
                  <div className="text-gray-300 space-y-4">
                    <p>We do not sell your personal information. We may share information only in these limited circumstances:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>With your explicit consent</li>
                      <li>To comply with legal obligations or court orders</li>
                      <li>To protect our rights, property, or safety</li>
                      <li>With trusted service providers who assist in our operations</li>
                      <li>In connection with a business transfer or acquisition</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">5. Data Security</h2>
                  <div className="text-gray-300 space-y-4">
                    <p>We implement industry-standard security measures:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Encryption of data in transit and at rest</li>
                      <li>Secure code execution in isolated containers</li>
                      <li>Regular security audits and monitoring</li>
                      <li>Access controls and authentication measures</li>
                      <li>Incident response procedures</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">6. Your Rights and Choices</h2>
                  <div className="text-gray-300 space-y-4">
                    <p>You have the right to:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Access and update your personal information</li>
                      <li>Delete your account and associated data</li>
                      <li>Export your content and data</li>
                      <li>Opt out of non-essential communications</li>
                      <li>Request information about data processing</li>
                    </ul>
                    <p className="mt-4">
                      To exercise these rights, contact us at <a href="mailto:privacy@devcapsules.com" className="text-blue-400 hover:text-blue-300">privacy@devcapsules.com</a>.
                    </p>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">7. Cookies and Tracking</h2>
                  <div className="text-gray-300 space-y-4">
                    <p>We use cookies and similar technologies to:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Keep you logged in to your account</li>
                      <li>Remember your preferences and settings</li>
                      <li>Analyze how our platform is used</li>
                      <li>Provide personalized experiences</li>
                    </ul>
                    <p>You can control cookie settings through your browser preferences.</p>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">8. International Data Transfers</h2>
                  <div className="text-gray-300 space-y-4">
                    <p>
                      Devcapsules operates globally. Your information may be transferred to and processed in countries 
                      other than your own. We ensure appropriate safeguards are in place for international transfers.
                    </p>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">9. Children's Privacy</h2>
                  <div className="text-gray-300 space-y-4">
                    <p>
                      Our platform is designed for educational use, including by minors under supervision. 
                      We do not knowingly collect personal information from children under 13 without 
                      parental consent. Educational institutions using our platform are responsible for 
                      ensuring appropriate consent and privacy protections for their students.
                    </p>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">10. Changes to This Policy</h2>
                  <div className="text-gray-300 space-y-4">
                    <p>
                      We may update this privacy policy from time to time. We will notify you of significant 
                      changes by email or through our platform. Your continued use of Devcapsules after 
                      changes take effect constitutes acceptance of the updated policy.
                    </p>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">11. Contact Us</h2>
                  <div className="text-gray-300 space-y-4">
                    <p>If you have questions about this privacy policy or our data practices, please contact us:</p>
                    <ul className="list-none space-y-2 ml-4">
                      <li>Email: <a href="mailto:privacy@devcapsules.com" className="text-blue-400 hover:text-blue-300">privacy@devcapsules.com</a></li>
                      <li>General inquiries: <a href="mailto:hello@devcapsules.com" className="text-blue-400 hover:text-blue-300">hello@devcapsules.com</a></li>
                      <li>Contact form: <a href="/contact" className="text-blue-400 hover:text-blue-300">devcapsules.com/contact</a></li>
                    </ul>
                  </div>
                </section>

              </div>
            </div>

            <div className="mt-12 p-6 bg-blue-600/20 border border-blue-500/30 rounded-xl">
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Questions about your privacy?</h3>
                  <p className="text-gray-300">
                    We're committed to transparency and protecting your privacy. If you have any questions 
                    or concerns about how we handle your data, please don't hesitate to reach out to our 
                    privacy team.
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