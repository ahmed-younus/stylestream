import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Terms = () => {
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
          TERMS AND CONDITIONS
        </h1>
        <p className="text-muted-foreground mb-8">
          Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        <div className="space-y-8 font-body text-sm leading-relaxed">
          <section>
            <h2 className="font-display text-lg tracking-wider mb-4">1. ACCEPTANCE OF TERMS</h2>
            <p className="text-muted-foreground">
              By accessing and using Style Dream ("the Service," "we," "us," or "our"), you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our Service. We reserve the right to modify these terms at any time, and your continued use of the Service constitutes acceptance of any modifications.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg tracking-wider mb-4">2. SERVICE DESCRIPTION</h2>
            <p className="text-muted-foreground">
              Style Dream provides an AI-powered virtual try-on service that allows users to visualise how clothing items may appear on them. The Service uses artificial intelligence technology to generate images. These generated images are approximations and may not accurately represent how garments will actually fit or appear in real life. We make no guarantees regarding the accuracy, reliability, or quality of the AI-generated content.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg tracking-wider mb-4">3. USER ACCOUNTS AND REGISTRATION</h2>
            <p className="text-muted-foreground mb-4">
              To access certain features of the Service, you must create an account. You agree to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain the security of your password and account</li>
              <li>Accept responsibility for all activities that occur under your account</li>
              <li>Notify us immediately of any unauthorised use of your account</li>
              <li>Be at least 18 years of age, or have parental/guardian consent if under 18</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg tracking-wider mb-4">4. CREDITS AND PAYMENTS</h2>
            <p className="text-muted-foreground mb-4">
              The Service operates on a credit-based system:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Credits are required to generate virtual try-on images</li>
              <li>New users receive complimentary credits upon registration</li>
              <li>Additional credits may be purchased through the Service</li>
              <li>All credit purchases are final and non-refundable</li>
              <li>Credits have no cash value and cannot be transferred, sold, or exchanged</li>
              <li>We reserve the right to modify credit pricing and packages at any time</li>
              <li>Unused credits do not expire but may be forfeited upon account termination</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg tracking-wider mb-4">5. USER CONTENT AND IMAGES</h2>
            <p className="text-muted-foreground mb-4">
              By uploading images to the Service, you:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Grant us a non-exclusive, worldwide, royalty-free licence to use, process, and store your images solely for the purpose of providing the Service</li>
              <li>Confirm that you have all necessary rights to the images you upload</li>
              <li>Agree not to upload images containing illegal, offensive, or inappropriate content</li>
              <li>Acknowledge that AI-generated images remain your property but we may retain copies for service improvement</li>
              <li>Accept that we are not responsible for any unauthorised access to or alteration of your content</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg tracking-wider mb-4">6. PROHIBITED USES</h2>
            <p className="text-muted-foreground mb-4">
              You agree not to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Use the Service for any unlawful purpose or in violation of any laws</li>
              <li>Upload images of individuals without their consent</li>
              <li>Create content that is defamatory, obscene, or infringes on others' rights</li>
              <li>Attempt to reverse engineer, decompile, or hack the Service</li>
              <li>Use automated systems to access the Service without permission</li>
              <li>Resell, redistribute, or commercially exploit the Service without authorisation</li>
              <li>Impersonate others or misrepresent your affiliation with any person or entity</li>
              <li>Interfere with or disrupt the integrity or performance of the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg tracking-wider mb-4">7. INTELLECTUAL PROPERTY</h2>
            <p className="text-muted-foreground">
              All content, features, and functionality of the Service, including but not limited to text, graphics, logos, icons, images, software, and the underlying technology, are owned by Style Dream or its licensors and are protected by international copyright, trademark, patent, and other intellectual property laws. You may not copy, modify, distribute, sell, or lease any part of our Service without express written permission.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg tracking-wider mb-4">8. THIRD-PARTY PRODUCTS AND SERVICES</h2>
            <p className="text-muted-foreground">
              The Service may display products from third-party retailers. We do not manufacture, sell, or warrant these products. Any purchases made through external links are subject to the terms and conditions of those third-party retailers. We are not responsible for the quality, safety, legality, or any other aspect of third-party products or services. Product images displayed through our virtual try-on feature are for visualisation purposes only and may differ from actual products.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg tracking-wider mb-4">9. DISCLAIMER OF WARRANTIES</h2>
            <p className="text-muted-foreground">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT ANY WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS. AI-GENERATED IMAGES ARE APPROXIMATIONS AND WE MAKE NO GUARANTEES REGARDING THEIR ACCURACY OR SUITABILITY FOR ANY PURPOSE.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg tracking-wider mb-4">10. LIMITATION OF LIABILITY</h2>
            <p className="text-muted-foreground">
              TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, STYLE DREAM AND ITS DIRECTORS, EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM: (A) YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICE; (B) ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE SERVICE; (C) ANY CONTENT OBTAINED FROM THE SERVICE; (D) UNAUTHORISED ACCESS, USE, OR ALTERATION OF YOUR TRANSMISSIONS OR CONTENT; OR (E) ANY PURCHASING DECISIONS MADE BASED ON AI-GENERATED IMAGES. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID TO US IN THE TWELVE (12) MONTHS PRIOR TO THE CLAIM.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg tracking-wider mb-4">11. INDEMNIFICATION</h2>
            <p className="text-muted-foreground">
              You agree to defend, indemnify, and hold harmless Style Dream and its officers, directors, employees, contractors, agents, licensors, suppliers, successors, and assigns from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable legal fees) arising out of or relating to your violation of these Terms or your use of the Service, including but not limited to any content you submit or any use of the Service's content other than as expressly authorised in these Terms.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg tracking-wider mb-4">12. TERMINATION</h2>
            <p className="text-muted-foreground">
              We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including without limitation if you breach these Terms. Upon termination, your right to use the Service will immediately cease. All provisions of these Terms which by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, indemnity, and limitations of liability. Any unused credits at the time of termination shall be forfeited.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg tracking-wider mb-4">13. GOVERNING LAW AND JURISDICTION</h2>
            <p className="text-muted-foreground">
              These Terms shall be governed by and construed in accordance with the laws of England and Wales, without regard to its conflict of law provisions. You agree to submit to the exclusive jurisdiction of the courts located in England and Wales to resolve any legal matter arising from these Terms. Notwithstanding the foregoing, we may seek injunctive or other equitable relief in any court of competent jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg tracking-wider mb-4">14. DISPUTE RESOLUTION</h2>
            <p className="text-muted-foreground">
              Any dispute arising out of or relating to these Terms or the Service shall first be attempted to be resolved through good faith negotiation. If the dispute cannot be resolved within thirty (30) days, either party may pursue legal remedies. You agree to waive any right to participate in a class action lawsuit or class-wide arbitration against us.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg tracking-wider mb-4">15. CHANGES TO TERMS</h2>
            <p className="text-muted-foreground">
              We reserve the right to modify or replace these Terms at any time at our sole discretion. If a revision is material, we will provide at least thirty (30) days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg tracking-wider mb-4">16. SEVERABILITY</h2>
            <p className="text-muted-foreground">
              If any provision of these Terms is held to be unenforceable or invalid, such provision will be changed and interpreted to accomplish the objectives of such provision to the greatest extent possible under applicable law, and the remaining provisions will continue in full force and effect.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg tracking-wider mb-4">17. ENTIRE AGREEMENT</h2>
            <p className="text-muted-foreground">
              These Terms constitute the entire agreement between you and Style Dream regarding our Service and supersede and replace any prior agreements we might have had between us regarding the Service.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg tracking-wider mb-4">18. CONTACT INFORMATION</h2>
            <p className="text-muted-foreground">
              If you have any questions about these Terms, please contact us through the contact information provided on our website.
            </p>
          </section>
        </div>
      </motion.main>
      <Footer />
    </div>
  );
};

export default Terms;
