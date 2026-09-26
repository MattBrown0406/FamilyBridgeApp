import { Link } from 'react-router-dom';
import { LegalPage, type LegalSection } from '@/components/site/LegalPage';

const sections: LegalSection[] = [
  {
    id: 'collect',
    title: 'Information we collect',
    body: (
      <>
        <p><strong>Account information.</strong> Your email address and password (stored securely by our sign-in provider — we never see your password), and the name, role and relationship you enter for yourself in your family (for example “Mom” or “in recovery”).</p>
        <p><strong>Family information you add.</strong> Depending on the features your family uses: family chat messages; money requests, votes and receipt photos; recovery meetings; appointments; medications and doses taken; drug-test results (including results sent by a partner lab when your family registers a test kit); daily check-ins (mood, stress, obsessive thinking, self-care); boundaries, goals, relapse plan, wins and family-meeting agenda; care-team contacts; conversation notes; intervention letters; and your recovery start date.</p>
        <p><strong>Photos and documents you choose to upload.</strong> Receipt photos, lab reports, discharge or aftercare plans, and screenshots you ask the coach to look at. Lab reports, aftercare plans and screenshots are read once to give you a result and are not stored.</p>
        <p><strong>Professional information.</strong> If you use FamilyBridge as a professional: your name, title, practice name and your practice's branding (logo and colors), plus the notes, tasks, sessions and messages you create for families who connect with you.</p>
        <p><strong>Purchases.</strong> Whether you have an active subscription or a purchased SOS session, handled through Apple and our subscription provider. We never receive your card details.</p>
        <p><strong>Device information.</strong> A push-notification token (so we can send the notifications you allow), your language, and basic technical information needed to run the app.</p>
        <p><strong>Live Coaching.</strong> When you use Live Coaching, speech is turned into text on your phone. <strong>Audio is never recorded, stored or uploaded.</strong> Only the text of the recent conversation is sent to our AI provider to generate a suggestion, and it isn't stored.</p>
      </>
    ),
  },
  {
    id: 'use',
    title: 'How we use your information',
    body: (
      <>
        <ul>
          <li>To run FamilyBridge and show your information to the people you've chosen to share it with</li>
          <li>To send notifications about activity in your family or practice (you can turn these off in your phone's settings)</li>
          <li>To provide the AI coaching features you choose to use</li>
          <li>To provide SOS support sessions you start</li>
          <li>To process subscriptions and purchases</li>
          <li>To keep FamilyBridge secure, prevent abuse (including the family chat respect filter), and respond to support requests</li>
        </ul>
        <p><strong>We do not sell your personal information, and we do not use it for advertising.</strong></p>
      </>
    ),
  },
  {
    id: 'sharing',
    title: 'Who can see your information',
    body: (
      <>
        <p><strong>Your family.</strong> Information you add to your family is visible to the other approved members of your family, as the app describes. Some items are more private: medications are visible to your family only if you choose to share them, and intervention letters are private to the writer unless shared. <strong>The person in recovery can never see intervention letters, conversation notes or Family Insights.</strong></p>
        <p><strong>Professionals you connect.</strong> A parent or partner decides whether to connect a professional (for example an interventionist, treatment center, therapist, coach, sober living or outpatient program) and chooses exactly which areas they can see — money, meetings, appointments, medications, drug tests, your plan, check-ins and family chat (off unless you turn it on). A professional who can see family chat can also post in it, clearly labeled. You can change these choices or disconnect at any time, and your family can see a log of when professionals viewed your information.</p>
        <p><strong>Handoffs between professionals.</strong> When a professional refers your family to another provider, nothing is shared until a parent or partner approves and chooses what the new provider can see. If your care history is included, the new provider can read earlier providers' session summaries, tasks and messages — and their clinical notes only if the referring professional chose to share them.</p>
        <p><strong>SOS sessions.</strong> If you start a 24-hour SOS session, the FamilyBridge SOS line (a certified interventionist at Freedom Interventions) can read and reply to the messages in that session only — not your other family information. A summary and transcript of the session are kept by FamilyBridge for continuity of care.</p>
        <p><strong>Lab partners.</strong> If you register a drug-test kit from a partner lab, the lab sends the result to FamilyBridge and it appears in your family's drug tests.</p>
        <p><strong>Legal requirements.</strong> We may disclose information if required by law, or to protect someone's safety or our rights.</p>
      </>
    ),
  },
  {
    id: 'ai',
    title: 'AI features',
    body: (
      <>
        <p>FamilyBridge's coaching features use <strong>Claude, an AI model made by Anthropic</strong>. Before any of your information is sent to Anthropic, the app asks for your permission, and you can turn AI features off at any time in <strong>Settings → Privacy &amp; account</strong>. Everything else in FamilyBridge works without AI.</p>
        <p>When you use an AI feature, we send only what that feature needs:</p>
        <div className="overflow-x-auto">
          <table>
            <thead><tr><th>Feature</th><th>What's sent</th></tr></thead>
            <tbody>
              <tr><td>AI Coach</td><td>Your question, your recent coaching conversation, a short description of your family, and any screenshots you attach</td></tr>
              <tr><td>Live Coaching</td><td>The text of the recent conversation (never audio)</td></tr>
              <tr><td>Lab report and aftercare reading</td><td>The photo, PDF or text you choose</td></tr>
              <tr><td>Letter feedback</td><td>The letter text</td></tr>
              <tr><td>Family Insights</td><td>The family's last 30 days of chat, conversation notes, check-ins, agreements, goals, appointments, tests and money requests — only if a family helper turns Family Insights on</td></tr>
              <tr><td>Professional AI Assistant</td><td>The information the family has shared with that professional</td></tr>
            </tbody>
          </table>
        </div>
        <p>Anthropic processes this information to generate the response on our behalf and <strong>does not use it to train its models</strong>. AI output can be wrong and is not medical, legal or clinical advice.</p>
      </>
    ),
  },
  {
    id: 'providers',
    title: 'Service providers',
    body: <p>We use a small number of providers to run FamilyBridge, each only for its purpose: Supabase (secure database, file storage and sign-in), Anthropic (AI features you've agreed to), Apple and RevenueCat (subscriptions and purchases), Expo (push notifications) and Resend (email).</p>,
  },
  {
    id: 'security',
    title: 'Security',
    body: <p>Your information is encrypted in transit and at rest. Access rules are enforced on our servers for every record — not just in the app — so people see only what they've been given access to. Receipts are stored privately and shown through short-lived links. No system is perfectly secure, but we work hard to protect your information and will notify you as required by law if a breach affects you.</p>,
  },
  {
    id: 'choices',
    title: 'Your choices and rights',
    body: (
      <>
        <ul>
          <li><strong>See and correct</strong> your information in the app at any time.</li>
          <li><strong>Control sharing</strong> with professionals (what they see, or disconnect) and with AI (Settings → Privacy &amp; account).</li>
          <li><strong>Delete your account</strong> in the app: Settings → Privacy &amp; account → Delete my account. This permanently deletes your account and your personal information. If you're the only account in your family (or on your practice's team), the family or practice is deleted too. Other family members keep their own information.</li>
          <li><strong>Request a copy</strong> of your data by emailing us.</li>
        </ul>
        <p>Deleting your account doesn't cancel a subscription purchased through Apple — cancel it in your iPhone's Settings → your name → Subscriptions.</p>
      </>
    ),
  },
  {
    id: 'health',
    title: 'Health information',
    body: <p>FamilyBridge helps families organize and share information about a loved one's recovery and is not a healthcare provider. Professionals who use FamilyBridge are responsible for their own obligations for the records they keep; if your program is subject to HIPAA or 42 CFR Part 2, contact us about agreements before inviting families.</p>,
  },
  {
    id: 'children',
    title: 'Children',
    body: <p>FamilyBridge isn't directed to children under 13, and we don't knowingly collect their information. A family may add a young child as a member without an account (just a name) so they're included in family activities.</p>,
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    body: <p>We'll post any changes here and update the date above. If a change materially affects how we use your information, we'll let you know in the app.</p>,
  },
  {
    id: 'contact',
    title: 'Contact us',
    body: <p>FamilyBridge is operated by Freedom Interventions, LLC. Questions or requests: <a href="mailto:matt@freedominterventions.com">matt@freedominterventions.com</a>, or visit <Link to="/support">Support</Link>.</p>,
  },
];

const PrivacyPolicy = () => (
  <LegalPage
    title="Privacy Policy"
    path="/privacy"
    description="How FamilyBridge handles your family's information: what we collect, who can see it, AI features with your permission, and deleting your account."
    updated="September 2026"
    intro={<p>FamilyBridge helps families affected by a loved one's substance use stay connected, accountable and supported — together with the professionals they choose. This policy explains what we collect, how we use it, who can see it, and the choices you have.</p>}
    sections={sections}
  />
);

export default PrivacyPolicy;
