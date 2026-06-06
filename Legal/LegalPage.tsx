import React, { useState, useEffect } from 'react';
import { Shield, FileText, ArrowUp, ChevronRight, Mail, Building2 } from 'lucide-react';

const COMPANY_NAME = 'NewCol';
const CONTACT_EMAIL = 'support@company.com';
const LAST_UPDATED = 'June 6, 2026';

interface SectionDef {
  id: string;
  title: string;
}

const PRIVACY_SECTIONS: SectionDef[] = [
  { id: 'pp-intro', title: '1. Introduction' },
  { id: 'pp-info', title: '2. Information We Collect' },
  { id: 'pp-use', title: '3. How We Use Information' },
  { id: 'pp-sharing', title: '4. Data Sharing & Disclosure' },
  { id: 'pp-security', title: '5. Data Security' },
  { id: 'pp-retention', title: '6. Data Retention' },
  { id: 'pp-rights', title: '7. Your Rights' },
];

const TERMS_SECTIONS: SectionDef[] = [
  { id: 'tc-acceptance', title: '1. Acceptance of Terms' },
  { id: 'tc-access', title: '2. Authorized Access & Use' },
  { id: 'tc-responsibilities', title: '3. User Responsibilities' },
  { id: 'tc-prohibited', title: '4. Prohibited Activities' },
  { id: 'tc-ip', title: '5. Intellectual Property' },
  { id: 'tc-liability', title: '6. Limitation of Liability' },
  { id: 'tc-changes', title: '7. Changes to Terms' },
];

const SectionHeading: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => (
  <h3 id={id} className="scroll-mt-28 text-xl font-bold text-slate-900 mb-3 mt-10 flex items-center gap-2">
    <span className="w-1.5 h-6 bg-blue-600 rounded-full inline-block" />
    {children}
  </h3>
);

const Para: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-slate-600 leading-relaxed mb-4">{children}</p>
);

const Bullets: React.FC<{ items: React.ReactNode[] }> = ({ items }) => (
  <ul className="list-none space-y-2 mb-4">
    {items.map((item, i) => (
      <li key={i} className="flex items-start gap-2 text-slate-600 leading-relaxed">
        <ChevronRight size={16} className="text-blue-500 mt-1 flex-shrink-0" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

const LegalPage: React.FC = () => {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-slate-50 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-slate-50 to-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 backdrop-blur-md bg-white/90">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Building2 size={20} />
            </div>
            <div>
              <p className="font-bold text-slate-900 leading-tight">{COMPANY_NAME}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Internal Portal</p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-black text-blue-600 uppercase tracking-widest px-3 py-1.5 bg-blue-50 rounded-full border border-blue-100">
            <Shield size={12} /> Legal Center
          </span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            Privacy Policy &amp; Terms and Conditions
          </h1>
          <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed">
            This document outlines how {COMPANY_NAME} handles information and the terms governing
            the use of this internal application.
          </p>
          <p className="mt-3 text-[11px] font-black text-slate-400 uppercase tracking-widest">
            Last Updated: {LAST_UPDATED}
          </p>
        </div>

        <div className="grid lg:grid-cols-[260px_1fr] gap-8">
          {/* Table of Contents */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <nav className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">On This Page</p>

              <button
                onClick={() => scrollTo('privacy-policy')}
                className="w-full text-left flex items-center gap-2 font-bold text-slate-800 hover:text-blue-600 transition-colors mb-2"
              >
                <Shield size={15} className="text-blue-500" /> Privacy Policy
              </button>
              <ul className="space-y-1 mb-5 ml-1 border-l border-slate-100 pl-3">
                {PRIVACY_SECTIONS.map((s) => (
                  <li key={s.id}>
                    <button
                      onClick={() => scrollTo(s.id)}
                      className="text-left text-xs text-slate-500 hover:text-blue-600 transition-colors py-0.5"
                    >
                      {s.title}
                    </button>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => scrollTo('terms-conditions')}
                className="w-full text-left flex items-center gap-2 font-bold text-slate-800 hover:text-blue-600 transition-colors mb-2"
              >
                <FileText size={15} className="text-blue-500" /> Terms &amp; Conditions
              </button>
              <ul className="space-y-1 ml-1 border-l border-slate-100 pl-3">
                {TERMS_SECTIONS.map((s) => (
                  <li key={s.id}>
                    <button
                      onClick={() => scrollTo(s.id)}
                      className="text-left text-xs text-slate-500 hover:text-blue-600 transition-colors py-0.5"
                    >
                      {s.title}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Content */}
          <main className="space-y-10">
            {/* Privacy Policy */}
            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-7 md:p-10">
              <div id="privacy-policy" className="scroll-mt-28 flex items-center gap-3 mb-6 pb-5 border-b border-slate-100">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                  <Shield size={22} />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900">Privacy Policy</h2>
                  <p className="text-xs text-slate-400 font-medium">How we collect, use, and protect data</p>
                </div>
              </div>

              <SectionHeading id="pp-intro">1. Introduction</SectionHeading>
              <Para>
                {COMPANY_NAME} ("we", "us", or "our") operates this application strictly for internal
                office and company use. This Privacy Policy explains how we collect, use, store, and
                protect information when authorized personnel access and use the application.
              </Para>

              <SectionHeading id="pp-info">2. Information We Collect</SectionHeading>
              <Para>In the course of providing this internal tool, we may collect:</Para>
              <Bullets
                items={[
                  <><strong>Account information</strong> — name, work email address, role, and login credentials of authorized agents.</>,
                  <><strong>Operational data</strong> — conversations, messages, customer records, and page configurations processed through the platform.</>,
                  <><strong>Usage data</strong> — activity logs, access timestamps, and actions performed within the portal.</>,
                  <><strong>Technical data</strong> — browser type, device information, and connection details for security and diagnostics.</>,
                ]}
              />

              <SectionHeading id="pp-use">3. How We Use Information</SectionHeading>
              <Para>Information collected is used solely for legitimate internal business purposes, including:</Para>
              <Bullets
                items={[
                  'Authenticating users and managing authorized access.',
                  'Operating, maintaining, and improving the application.',
                  'Managing customer communications and support workflows.',
                  'Monitoring security, preventing misuse, and ensuring compliance with internal policies.',
                ]}
              />

              <SectionHeading id="pp-sharing">4. Data Sharing &amp; Disclosure</SectionHeading>
              <Para>
                This is an internal application. We do not sell or rent any data. Information may be
                shared only with authorized employees, contractors, or service providers (such as our
                cloud and database providers) who need access to operate the application, and only under
                appropriate confidentiality obligations. We may also disclose information where required
                by law or to protect our legal rights.
              </Para>

              <SectionHeading id="pp-security">5. Data Security</SectionHeading>
              <Para>
                We implement reasonable technical and organizational measures — including access controls,
                authentication, and encrypted connections where applicable — to protect information against
                unauthorized access, alteration, or disclosure. However, no method of transmission or storage
                is completely secure, and we cannot guarantee absolute security.
              </Para>

              <SectionHeading id="pp-retention">6. Data Retention</SectionHeading>
              <Para>
                We retain information only for as long as necessary to fulfill the purposes described in this
                policy, comply with legal obligations, resolve disputes, and enforce our agreements. When data
                is no longer required, it is securely deleted or anonymized.
              </Para>

              <SectionHeading id="pp-rights">7. Your Rights</SectionHeading>
              <Para>
                Authorized users may request access to, correction of, or deletion of their personal account
                information, subject to internal policy and applicable law. To exercise these rights, contact
                us using the details below.
              </Para>
            </section>

            {/* Terms & Conditions */}
            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-7 md:p-10">
              <div id="terms-conditions" className="scroll-mt-28 flex items-center gap-3 mb-6 pb-5 border-b border-slate-100">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                  <FileText size={22} />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900">Terms &amp; Conditions</h2>
                  <p className="text-xs text-slate-400 font-medium">Rules governing use of the application</p>
                </div>
              </div>

              <SectionHeading id="tc-acceptance">1. Acceptance of Terms</SectionHeading>
              <Para>
                By accessing or using this application, you agree to be bound by these Terms and Conditions.
                If you do not agree, you must not access or use the application. These Terms apply to all
                authorized personnel granted access.
              </Para>

              <SectionHeading id="tc-access">2. Authorized Access &amp; Use</SectionHeading>
              <Para>
                This application is provided exclusively for internal {COMPANY_NAME} business use. Access is
                limited to authorized employees and agents using credentials assigned to them. You may not
                share, transfer, or expose your credentials to any unauthorized party.
              </Para>

              <SectionHeading id="tc-responsibilities">3. User Responsibilities</SectionHeading>
              <Bullets
                items={[
                  'Keep your login credentials confidential and secure.',
                  'Use the application only for legitimate, work-related purposes.',
                  'Ensure that data entered and processed is accurate and lawful.',
                  'Report any security incidents or unauthorized access promptly.',
                ]}
              />

              <SectionHeading id="tc-prohibited">4. Prohibited Activities</SectionHeading>
              <Para>You agree not to:</Para>
              <Bullets
                items={[
                  'Attempt to gain unauthorized access to any part of the system or other accounts.',
                  'Use the application for any unlawful, harmful, or fraudulent activity.',
                  'Interfere with, disrupt, or compromise the integrity or performance of the application.',
                  'Copy, distribute, or disclose internal data to unauthorized third parties.',
                ]}
              />

              <SectionHeading id="tc-ip">5. Intellectual Property</SectionHeading>
              <Para>
                All content, software, designs, and materials within this application are the property of
                {' '}{COMPANY_NAME} or its licensors and are protected by applicable intellectual property laws.
                No rights are granted except as expressly stated for authorized internal use.
              </Para>

              <SectionHeading id="tc-liability">6. Limitation of Liability</SectionHeading>
              <Para>
                The application is provided on an "as is" and "as available" basis. To the maximum extent
                permitted by law, {COMPANY_NAME} shall not be liable for any indirect, incidental, or
                consequential damages arising from the use of, or inability to use, the application.
              </Para>

              <SectionHeading id="tc-changes">7. Changes to Terms</SectionHeading>
              <Para>
                We may update these Terms and Conditions and the Privacy Policy from time to time. The
                "Last Updated" date reflects the most recent revision. Continued use of the application after
                changes constitutes acceptance of the revised terms.
              </Para>
            </section>

            {/* Contact */}
            <section className="bg-slate-900 rounded-3xl p-7 md:p-10 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Mail size={120} />
              </div>
              <div className="relative z-10">
                <h2 className="text-2xl font-extrabold mb-2">Contact Us</h2>
                <p className="text-slate-400 mb-5 leading-relaxed max-w-xl">
                  If you have any questions about this Privacy Policy or these Terms and Conditions,
                  please reach out to our internal support team.
                </p>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/40"
                >
                  <Mail size={16} /> {CONTACT_EMAIL}
                </a>
              </div>
            </section>
          </main>
        </div>

        <footer className="mt-12 text-center text-[11px] text-slate-400 font-medium uppercase tracking-widest">
          © {new Date().getFullYear()} {COMPANY_NAME} • Internal Use Only
        </footer>
      </div>

      {/* Back to top */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
          className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xl shadow-blue-300 flex items-center justify-center transition-all active:scale-95"
        >
          <ArrowUp size={20} />
        </button>
      )}
    </div>
  );
};

export default LegalPage;
