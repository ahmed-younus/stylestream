import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto px-4 py-24 md:py-32"
      >
        <h1 className="font-display text-3xl md:text-4xl tracking-[0.1em] mb-8">
          PRIVACY POLICY
        </h1>
        <p className="text-muted-foreground mb-8">
          Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        <div className="space-y-8 font-body text-sm leading-relaxed">
          <section>
            <h2 className="font-display text-lg tracking-wider mb-4">1. INTRODUCTION</h2>
            <p className="text-muted-foreground">
              Style Dream ("we," "us," or "our") respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our virtual try-on service. Please read this policy carefully. If you do not agree with the terms of this Privacy Policy, please do not access the Service.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg tracking-wider mb-4">2. INFORMATION WE COLLECT</h2>
            <p className="text-muted-foreground mb-4">We collect information in the following ways:</p>
            
            <h3 className="font-display text-base tracking-wide mb-2 mt-4">2.1 Information You Provide</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Account information: email address, display name, and password</li>
              <li>Profile information: body measurements, gender preference, and style preferences</li>
              <li>Images: photographs you upload for virtual try-on purposes</li>
              <li>Payment information: processed securely through our third-party payment provider (Stripe)</li>
              <li>Communications: any messages or feedback you send to us</li>
            </ul>

            <h3 className="font-display text-base tracking-wide mb-2 mt-4">2.2 Information Collected Automatically</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Device information: browser type, operating system, device identifiers</li>
              <li>Usage data: pages visited, features used, time spent on the Service</li>
              <li>Log data: IP address, access times, referring URLs</li>
              <li>Cookies and similar technologies: as described in our Cookie Policy</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg tracking-wider mb-4">3. HOW WE USE YOUR INFORMATION</h2>
            <p className="text-muted-foreground mb-4">We use your information for the following purposes:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>To provide, maintain, and improve our Service</li>
              <li>To process virtual try-on requests using AI technology</li>
              <li>To process transactions and send related information</li>
              <li>To send you technical notices, updates, and support messages</li>
              <li>To respond to your comments, questions, and requests</li>
              <li>To monitor and analyse trends, usage, and activities</li>
              <li>To detect, investigate, and prevent fraudulent transactions and abuse</li>
              <li>To personalise and improve your experience</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg tracking-wider mb-4">4. LEGAL BASIS FOR PROCESSING (UK/EU USERS)</h2>
            <p className="text-muted-foreground mb-4">Under UK GDPR and EU GDPR, we process your data based on:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Contractual necessity:</strong> To perform our contract with you and provide the Service</li>
              <li><strong>Legitimate interests:</strong> To improve our Service, prevent fraud, and for marketing (where applicable)</li>
              <li><strong>Consent:</strong> Where you have given explicit consent for specific processing activities</li>
              <li><strong>Legal obligation:</strong> To comply with applicable laws and regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg tracking-wider mb-4">5. SHARING OF INFORMATION</h2>
            <p className="text-muted-foreground mb-4">We may share your information with:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Service providers:</strong> Third parties who perform services on our behalf (hosting, payment processing, AI processing, analytics)</li>
              <li><strong>Business transfers:</strong> In connection with any merger, acquisition, or sale of assets</li>
              <li><strong>Legal requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>With your consent:</strong> When you have given us permission to share</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              We do not sell, rent, or trade your personal information to third parties for their marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg tracking-wider mb-4">6. DATA RETENTION</h2>
            <p className="text-muted-foreground">
              We retain your personal data only for as long as necessary to fulfil the purposes for which it was collected, including to satisfy any legal, accounting, or reporting requirements. For uploaded images, we retain them for as long as your account is active or as needed to provide the Service. You may request deletion of your data at any time, subject to our legal obligations to retain certain information.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg tracking-wider mb-4">7. DATA SECURITY</h2>
            <p className="text-muted-foreground">
              We implement appropriate technical and organisational measures to protect your personal data against unauthorised or unlawful processing, accidental loss, destruction, or damage. These measures include encryption, secure servers, and access controls. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg tracking-wider mb-4">8. YOUR RIGHTS</h2>
            <p className="text-muted-foreground mb-4">Depending on your location, you may have the following rights:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
              <li><strong>Rectification:</strong> Request correction of inaccurate or incomplete data</li>
              <li><strong>Erasure:</strong> Request deletion of your personal data ("right to be forgotten")</li>
              <li><strong>Restriction:</strong> Request restriction of processing in certain circumstances</li>
              <li><strong>Portability:</strong> Request transfer of your data to another service</li>
              <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
              <li><strong>Withdraw consent:</strong> Withdraw consent at any time where processing is based on consent</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              To exercise these rights, please contact us using the information provided below. We will respond to your request within one month.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg tracking-wider mb-4">9. INTERNATIONAL DATA TRANSFERS</h2>
            <p className="text-muted-foreground">
              Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws that are different from the laws of your country. We ensure appropriate safeguards are in place when transferring data internationally, including the use of standard contractual clauses approved by relevant authorities.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg tracking-wider mb-4">10. COOKIES AND TRACKING TECHNOLOGIES</h2>
            <p className="text-muted-foreground mb-4">
              We use cookies and similar tracking technologies to collect and store information. These include:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Essential cookies:</strong> Necessary for the Service to function properly</li>
              <li><strong>Analytics cookies:</strong> Help us understand how visitors interact with the Service</li>
              <li><strong>Preference cookies:</strong> Remember your settings and preferences</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              You can control cookies through your browser settings. Disabling certain cookies may affect the functionality of the Service.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg tracking-wider mb-4">11. CHILDREN'S PRIVACY</h2>
            <p className="text-muted-foreground">
              Our Service is not intended for children under 16 years of age. We do not knowingly collect personal information from children under 16. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately. If we become aware that we have collected personal data from a child under 16 without verification of parental consent, we will take steps to delete that information.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg tracking-wider mb-4">12. THIRD-PARTY LINKS</h2>
            <p className="text-muted-foreground">
              Our Service may contain links to third-party websites or services that are not operated by us. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party sites or services. We encourage you to review the privacy policy of every site you visit.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg tracking-wider mb-4">13. CHANGES TO THIS PRIVACY POLICY</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes. Changes are effective when they are posted on this page.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg tracking-wider mb-4">14. CONTACT US</h2>
            <p className="text-muted-foreground mb-4">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Through the contact form on our website</li>
              <li>By email at the address provided on our website</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              You also have the right to lodge a complaint with a supervisory authority, in particular in the UK with the Information Commissioner's Office (ICO).
            </p>
          </section>
        </div>
      </motion.main>
      <Footer />
    </div>
  );
};

export default Privacy;
