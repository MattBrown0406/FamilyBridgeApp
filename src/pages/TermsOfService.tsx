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
        <p>FamilyBridge helps families affected by a loved one's substance use communicate and stay accountable: money requests, meetings, appointments, medications, drug tests, check-ins, boundaries, goals and plans; optional AI coaching; optional connections with professionals the family chooses; Find a professional, a directory of professionals families can ask for help; and optional SOS messaging sessions.</p>
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
        <p>A family is a private group. People join with the family's invite code and are approved by a parent or partner. Parents and partners make decisions that affect the whole family, such as approving members, connecting professionals, choosing what professionals can see (for a practice that doesn't provide the family's FamilyBridge), and accepting handoffs. A practice that provides the family's FamilyBridge sees the family-wide areas described in our <Link to="/privacy">Privacy Policy</Link> while it does; the family's way to stop that is to disconnect.</p>
        <p>Share only information you have the right to share, and respect the privacy of the other people in your family. Family chat has a respect filter that blocks insults, threats and shaming language; please use the App kindly.</p>
      </>
    ),
  },
  {
    id: 'professionals',
    title: 'Professionals',
    body: (
      <>
        <p>Professionals and their staff may see only what a family shares with their practice — the areas the family chooses, or, for a practice that provides the family's FamilyBridge, the family-wide areas plus each person's own information under that person's release — and must use it only to support that family's care. Professionals are solely responsible for their own services, licensing, records, and compliance with the laws that apply to them (including, where applicable, HIPAA and 42 CFR Part 2), and for any fees they charge families, which are arranged directly between the professional and the family.</p>
        <p>Professionals are responsible for their own legal, consent and confidentiality duties for everything they receive through FamilyBridge and everything they send outside it, including intake answers and service agreements, information shared under releases, and progress reports. A progress report may be made only under a standing authorization signed in the App by the person in recovery, only for the recipient it names and only with what it allows; the professional is responsible for checking that the report is appropriate to send and for how it is sent. Once information leaves FamilyBridge, it is outside our control. Progress-note drafts and other AI output are drafts for the professional to review; the professional is responsible for anything they file or share.</p>
        <p>Professional plans (Solo, Practice and Organization) are billed monthly, quarterly or annually, in advance for each period, and renew automatically until cancelled. Plans bought online are processed by Square and can be cancelled anytime at familybridgeapp.com/practice-billing; the plan stays active through the period already paid. Plans bought in the iPhone app are billed through your Apple ID and managed in your Apple ID settings. We may limit the number of connected families according to the practice's plan.</p>
      </>
    ),
  },
  {
    id: 'releases',
    title: 'Releases and authorizations',
    body: <p>Signing a release to a practice, or an authorization for progress reports, is always your choice. If you don't sign, you can keep using FamilyBridge. You can take a release or an authorization back at any time in the App; that stops sharing from then on, but it can't undo what was already shared while it stood, and a report already sent can't be unsent. A practice's release ends when your family's connection with that practice ends. What each release and authorization covers is shown in the App before you sign and described in our <Link to="/privacy">Privacy Policy</Link>.</p>,
  },
  {
    id: 'directory',
    title: 'Find a professional',
    body: (
      <>
        <p>Find a professional lists professionals at practices on a paid FamilyBridge plan. To be listed, a professional must confirm that they receive no payment from any treatment program for placements, and must keep their listing accurate and current. FamilyBridge reviews each listing, and any change to it, before families see it, and may decline, hide or remove a listing. A listing drops out of the directory while its practice's plan isn't paid. The order of results is not a ranking or a recommendation.</p>
        <p><strong>FamilyBridge does not endorse, recommend or guarantee any professional</strong>, their credentials, their services or any outcome, and is not a party to any arrangement between a family and a professional. Families should make their own choice and check credentials themselves. Asking a professional for help through the directory shares the information described in our <Link to="/privacy">Privacy Policy</Link>; if a professional accepts, connecting is still your family's choice.</p>
        <p><strong>The directory is not for emergencies.</strong> Requests for help may not be seen or answered quickly. If anyone may be in danger, call 911. For a mental-health crisis, call or text 988.</p>
      </>
    ),
  },
  {
    id: 'reviews',
    title: 'Reviews',
    body: (
      <>
        <p>Family members (other than the person in recovery) can review professionals who have worked with their family through FamilyBridge. Reviews are shown with the reviewer's first name and state. Write only about your own experience, honestly. Don't name or identify anyone, share private or health details about anyone (including yourself or your loved one), or post anything abusive, threatening or false. Professionals may reply publicly, but must never discuss anyone's care in a reply.</p>
        <p>Anyone signed in can report a review or a reply. FamilyBridge may hide reviews or replies that identify someone, share private details or are abusive, but will not hide a review for being negative. Reviews are the opinions of their writers, not of FamilyBridge.</p>
      </>
    ),
  },
  {
    id: 'payments',
    title: 'Subscriptions and purchases',
    body: (
      <>
        <p><strong>Family Plus</strong> is an auto-renewing subscription ($19.99 per month, or as shown in the App) that covers everyone in your family and includes the App's AI features, the full family program and one 24-hour SOS session each billing cycle. Families working with a professional on a paid FamilyBridge plan may have Family Plus included while connected, and for 14 days after that professional completes their care.</p>
        <p><strong>SOS sessions.</strong> Family Plus includes one 24-hour SOS session per billing cycle. Any family can buy a session as a one-time in-app purchase.</p>
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
        <p>AI features (AI Coach, Live Coaching, conversation practice, document reading, letter feedback, Family Insights, and the professional AI Assistant and progress-note drafts) are powered by Anthropic's Claude. Family AI features are part of Family Plus (free families get a limited number of tries), and the professional AI Assistant is included with paid professional plans. They stay off until you agree in the App, and you can turn them off at any time in Settings → Privacy &amp; account. Family Insights runs only if a family helper turns it on. A practice that provides a family's FamilyBridge can use its AI Assistant with what it sees of that family, as described in our <Link to="/privacy">Privacy Policy</Link>.</p>
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
    description="The terms for using FamilyBridge: families, professionals, releases and authorizations, Find a professional and reviews, subscriptions and SOS sessions, AI features, drug-test results, and your account."
    updated="November 20, 2026"
    intro={<p>These terms explain how FamilyBridge works, what you can expect from us, and what we ask of you. We've tried to keep them plain.</p>}
    sections={sections}
  />
);

export default TermsOfService;
