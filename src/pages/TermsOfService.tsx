import { Link } from 'react-router-dom';
import { LegalPage, type LegalSection } from '@/components/site/LegalPage';

const sections: LegalSection[] = [
  {
    id: 'acceptance',
    title: 'Acceptance of these Terms',
    body: <p>By creating an account or using FamilyBridge (the “App”), you agree to these Terms of Service and to our <Link to="/privacy">Privacy Policy</Link>. If you use the App from Apple's App Store, our <Link to="/eula">End User License Agreement</Link> also applies. If you don't agree, please don't use the App. FamilyBridge is operated by Freedom Interventions, LLC (“FamilyBridge,” “we,” “us”).</p>,
  },
  {
    id: 'service',
    title: 'What FamilyBridge is — and isn’t',
    body: (
      <>
        <p>FamilyBridge helps families affected by a loved one's substance use communicate and stay accountable: money requests, meetings, appointments, medications, drug tests, check-ins, boundaries, goals and plans; optional AI coaching; optional connections with professionals the family chooses; and optional SOS messaging sessions.</p>
        <p><strong>FamilyBridge is not a medical, mental-health, legal or emergency service</strong>, and nothing in the App is a diagnosis, treatment or professional advice. SOS sessions are time-limited messaging support from a certified interventionist; they are not an emergency response and are not monitored continuously. <strong>If anyone may be in danger, call 911. For a mental-health crisis, call or text 988.</strong></p>
      </>
    ),
  },
  {
    id: 'eligibility',
    title: 'Eligibility and accounts',
    body: (
      <>
        <p>You must be at least 13 years old to use the App, and anyone under 18 needs a parent's or guardian's permission. You're responsible for keeping your login secure, for the accuracy of what you enter, and for activity under your account. Tell us right away if you think someone has accessed your account.</p>
        <p>You can delete your account at any time in the App: Settings → Privacy &amp; account → Delete my account.</p>
      </>
    ),
  },
  {
    id: 'families',
    title: 'Families',
    body: (
      <>
        <p>A family is a private group. People join with the family's invite code and are approved by a parent or partner. Parents and partners make decisions that affect the whole family, such as approving members, connecting professionals, choosing what professionals can see, and accepting handoffs.</p>
        <p>Share only information you have the right to share, and respect the privacy of the other people in your family. Family chat has a respect filter that blocks insults, threats and shaming language; please use the App kindly.</p>
      </>
    ),
  },
  {
    id: 'professionals',
    title: 'Professionals',
    body: (
      <>
        <p>Professionals and their staff may see only what a family chooses to share and must use it only to support that family's care. Professionals are solely responsible for their own services, licensing, records, and compliance with the laws that apply to them (including, where applicable, HIPAA and 42 CFR Part 2), and for any fees they charge families, which are arranged directly between the professional and the family.</p>
        <p>Professional plans (Solo, Practice and Organization) are billed monthly, quarterly or annually, in advance for each period, and renew automatically until cancelled. Plans bought online are processed by Square and can be cancelled anytime at familybridgeapp.com/practice-billing; the plan stays active through the period already paid. Plans bought in the iPhone app are billed through your Apple ID and managed in your Apple ID settings. We may limit the number of connected families according to the practice's plan.</p>
      </>
    ),
  },
  {
    id: 'payments',
    title: 'Subscriptions and purchases',
    body: (
      <>
        <p><strong>Family Plus</strong> is an auto-renewing subscription ($19.99 per month or $179 per year, or as shown in the App) that covers everyone in your family. Families working with a professional on a paid FamilyBridge plan may have Family Plus included while connected, and for 14 days after that professional completes their care.</p>
        <p><strong>SOS sessions.</strong> Each family includes one 24-hour SOS session per billing cycle. Additional sessions are a one-time in-app purchase.</p>
        <p><strong>Billing through Apple.</strong> In-app purchases are charged to your Apple ID. Subscriptions renew automatically unless cancelled at least 24 hours before the end of the current period. Manage or cancel them in your iPhone's Settings → your name → Subscriptions. Refunds are handled by Apple under its policies. Deleting your account does not cancel a subscription.</p>
        <p>We may change prices for future billing periods; Apple will notify you as required before a change takes effect.</p>
      </>
    ),
  },
  {
    id: 'ai',
    title: 'AI features',
    body: (
      <>
        <p>AI features (AI Coach, Live Coaching, conversation practice, document reading, letter feedback, Family Insights and the professional AI Assistant) are powered by Anthropic's Claude. They stay off until you agree in the App, and you can turn them off at any time in Settings → Privacy &amp; account. Family Insights runs only if a family helper turns it on.</p>
        <p>AI output may be inaccurate or incomplete and is not a substitute for professional judgment. Review it before relying on it or sharing it, and use your own judgment about what to say and do.</p>
      </>
    ),
  },
  {
    id: 'tests',
    title: 'Drug tests and lab results',
    body: <p>Drug-test results in the App are recorded by family members, professionals or partner labs, and results read from a photo by AI should be checked before saving. Results are for family support and communication only; FamilyBridge does not perform testing and doesn't warrant any result's accuracy. Don't rely on the App for legal, employment or court purposes.</p>,
  },
  {
    id: 'conduct',
    title: 'Acceptable use',
    body: (
      <ul>
        <li>Don't use the App for anything illegal, or to harass, threaten, stalk or harm anyone.</li>
        <li>Don't share someone else's private information without the right to do so.</li>
        <li>Don't try to access accounts, families or data that aren't yours, or interfere with the App's security or operation.</li>
        <li>Don't copy, resell or reverse-engineer the App.</li>
      </ul>
    ),
  },
  {
    id: 'content',
    title: 'Your content and our property',
    body: <p>You keep ownership of what you add to the App. You give us permission to store, process and display it only as needed to provide the App to you and the people you share it with (and, for AI features you use, to have our AI provider process it). The App, its design, software and content are owned by FamilyBridge and protected by intellectual-property laws.</p>,
  },
  {
    id: 'disclaimers',
    title: 'Disclaimers',
    body: <p>THE APP IS PROVIDED “AS IS” AND “AS AVAILABLE,” WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT. WE DON'T WARRANT THAT THE APP WILL BE UNINTERRUPTED, ERROR-FREE OR SECURE, OR THAT ANY OUTCOME — INCLUDING ANYONE'S RECOVERY — WILL RESULT FROM USING IT.</p>,
  },
  {
    id: 'liability',
    title: 'Limitation of liability',
    body: <p>TO THE FULLEST EXTENT PERMITTED BY LAW, FAMILYBRIDGE WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR PUNITIVE DAMAGES, OR ANY LOSS OF DATA, PROFITS OR GOODWILL, ARISING FROM YOUR USE OF THE APP. OUR TOTAL LIABILITY FOR ANY CLAIM IS LIMITED TO THE AMOUNT YOU PAID US IN THE 12 MONTHS BEFORE THE CLAIM, OR $100 IF GREATER. Some places don't allow these limits, so they may not apply to you.</p>,
  },
  {
    id: 'indemnity',
    title: 'Indemnification',
    body: <p>You agree to indemnify and hold harmless FamilyBridge and its officers, employees and agents from claims arising from your misuse of the App or violation of these Terms. Professionals additionally agree to do so for claims arising from their services to families.</p>,
  },
  {
    id: 'termination',
    title: 'Ending your use',
    body: <p>You can stop using the App and delete your account at any time. We may suspend or end access for conduct that violates these Terms or puts others at risk. Sections that by their nature should survive (such as ownership, disclaimers and limits of liability) survive termination.</p>,
  },
  {
    id: 'law',
    title: 'Governing law and changes',
    body: <p>These Terms are governed by the laws of the United States and the state in which Freedom Interventions, LLC is organized, without regard to conflict-of-law rules. We may update these Terms; we'll post changes here and, for material changes, notify you in the App. Continuing to use the App after changes take effect means you accept them.</p>,
  },
  {
    id: 'contact',
    title: 'Contact us',
    body: <p><a href="mailto:matt@freedominterventions.com">matt@freedominterventions.com</a> · <Link to="/support">Support</Link></p>,
  },
];

const TermsOfService = () => (
  <LegalPage
    title="Terms of Service"
    path="/terms"
    description="The terms for using FamilyBridge: families, professionals, subscriptions and SOS sessions, AI features, drug-test results, and your account."
    updated="September 2026"
    intro={<p>These terms explain how FamilyBridge works, what you can expect from us, and what we ask of you. We've tried to keep them plain.</p>}
    sections={sections}
  />
);

export default TermsOfService;
