import { Link } from 'react-router-dom';
import { LegalPage, type LegalSection } from '@/components/site/LegalPage';

const sections: LegalSection[] = [
  {
    id: 'collect',
    title: 'Information we collect',
    body: (
      <>
        <p><strong>Account information.</strong> Your email address and password (stored securely by our sign-in provider — we never see your password), and the name, role and relationship you enter for yourself in your family (for example “Mom” or “in recovery”).</p>
        <p><strong>Family information you add.</strong> Depending on the features your family uses: family chat messages; money requests, votes and receipt photos; recovery meetings; appointments; medications and doses taken; drug-test results (including results sent by a partner lab when your family registers a test kit); daily check-ins (mood, stress, obsessive thinking, self-care); boundaries, goals, relapse plan, wins and family-meeting agenda; care-team contacts; conversation notes; intervention letters; and your recovery start date. With the Together and safety tools: your Alignment Check answers; the family pact and who signed each version; your answers in Before you say yes; family-program progress; the treatment plan (programs you've called, insurance notes, who drives); the trust ladder; where your loved one is right now (still using, in treatment or early recovery); warning signs you note on the Early-Warning Radar; where your family's naloxone kits are, who has them and when they expire; and the Reach Out messages you log (who reached out, when, and what was sent).</p>
        <p><strong>Photos and documents you choose to upload.</strong> Receipt photos, lab reports, discharge or aftercare plans, and screenshots you ask the coach to look at. Lab reports, aftercare plans and screenshots are read once to give you a result and are not stored.</p>
        <p><strong>Location, only when you tap a button.</strong> FamilyBridge asks for your location only while you are using the app, and reads it once each time you choose to: when you search for meetings near you, when you check in or check out at a place (“I’m here”) or at a meeting, and when you answer a family member who asked where you are. <strong>FamilyBridge never tracks your location in the background.</strong> For a meeting search, your position is rounded to about half a mile before it leaves your phone, it is passed to the fellowship’s public meeting list without anything that identifies you, and it is not saved. For a check-in, a check-out or an answer, we store the point, how accurate your phone said it was, a place name, and the time. Exact map points are deleted after 90 days; the place name and time remain as your family’s record until you delete the check-in or your account. Two exceptions: an answer you gave to a family member who asked where you were stays with the two of you and can’t be deleted by you, and if you leave or are removed from a family, the check-ins you made while you were in it stay in that family’s record.</p>
        <p><strong>Documents you keep in the vault.</strong> Files you add to Documents (for example a discharge plan, an insurance card or a court notice) are stored privately for your family until you delete them.</p>
        <p><strong>Releases of information you sign.</strong> If you sign a release in the app: the provider you name, the family members you name, what you allow to be shared, the purpose, the end date, the name you typed to sign, and when you signed or revoked it.</p>
        <p><strong>Your answer to a practice's release.</strong> If a practice that provides your family's FamilyBridge asks for your release, we keep your answer (signed or declined), the name you typed to sign, and when you signed, declined or took it back, so there is a record of what was shared and when.</p>
        <p><strong>Progress-report authorizations.</strong> If you are the person in recovery and a practice asks you to authorize progress reports: who would receive them, what for, what they may include, the end date, your answer, the name you typed to sign, and when you signed, declined or took it back. Each report a practice makes under it is logged (who made it, when, for whom and the dates it covers).</p>
        <p><strong>Intake.</strong> If a practice you connect with uses an intake, we keep your answers to its questions and the service agreement you sign (with the name you typed and when).</p>
        <p><strong>Find a professional.</strong> When you search the directory, you answer a short questionnaire (your state, where your loved one is right now, the kind of help you want, and preferences such as video or in person, Spanish or insurance). Your answers are used to find matches and are saved only if you ask a professional for help. When you do, we keep your request: your first name, your family's name, your answers and your message. To count how often each professional is shown, we record which listings were shown to which signed-in person on which day.</p>
        <p><strong>Reviews.</strong> If you review a professional: your rating, what you write, your first name and state, and any reports of reviews you make.</p>
        <p><strong>Professional information.</strong> If you use FamilyBridge as a professional: your name, title, practice name and your practice's branding (logo and colors), plus the notes, tasks, sessions, messages, intake set-up, authorization requests and reports you create for families who connect with you. If you list yourself in Find a professional: what you put in your listing (for example your roles, credentials and license number, the states you're licensed in or serve, city, languages, whether you take insurance, a fee note and a short bio), your confirmation that you receive no payment from treatment programs for placements, our review of the listing, the reviews you receive and your replies.</p>
        <p><strong>Purchases.</strong> Whether you have an active subscription or a purchased SOS session, handled through Apple and our subscription provider. We never receive your card details.</p>
        <p><strong>Device information.</strong> A push-notification token (so we can send the notifications you allow), your language, and basic technical information needed to run the app.</p>
        <p><strong>Live Coaching and spoken practice.</strong> When you speak to Live Coaching or conversation practice, your device's speech service turns speech into text — on the device itself when it supports that; otherwise Apple's speech service (or, in a web browser, the browser's) may process the audio. <strong>FamilyBridge never records, stores or uploads audio.</strong> For Live Coaching, only the text of the recent conversation is sent to our AI provider to generate a suggestion, and FamilyBridge doesn't store it.</p>
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
          <li>To send notifications about activity in your family or practice, including requests for your release or authorization and answers to your requests for help (you can turn these off in your phone's settings)</li>
          <li>To send professionals a morning summary (by notification and email) of how many of their families need them and why — counts only, nothing about any family — and practices a monthly email with their directory totals</li>
          <li>To run Find a professional: match your questionnaire answers to listings, pass your request to the professional you ask, and count how often each professional is shown</li>
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
        <p><strong>Your family.</strong> Information you add to your family is visible to the other approved members of your family, as the app describes. Some items are more private: medications are visible to your family only if you choose to share them, and intervention letters are private to the writer unless shared. <strong>The person in recovery can never see intervention letters, conversation notes or Family Insights.</strong> Your Alignment Check answers are never shown to anyone: your family sees only the combined picture, and only once at least three people have answered.</p>
        <p><strong>Location is the most restricted.</strong> Nobody can ask where you are unless you have turned that on for yourself, and you choose each time whether to answer. Only family helpers can ask; an answer is visible only to you and the person who asked. Check-ins you make are visible to your family’s helpers; <strong>a helper’s check-ins and location are never shown to the person in recovery.</strong> Professionals can never ask where you are. A professional can see your location check-ins only if you sign a release to a practice that provides your family’s FamilyBridge (see below).</p>
        <p><strong>Documents and releases.</strong> For each document you add, you choose who can open it: your whole family, the family’s helpers only, or only you, and whether a professional you are connected with can open it. A practice that provides your family’s FamilyBridge can open documents shared within the family, and documents you keep to yourself only under your release. A release you sign is visible to you, to the family members it names, and to the practice it names if that practice is connected to your family in the app.</p>
        <p><strong>What changed lately.</strong> Your family’s helpers see a short summary of what has changed over recent weeks in what the family has logged and what you share with them (for example meetings, check-ins, appointments, money requests and any medication you share). It is worked out by simple arithmetic, not AI, and it is not shown to the person in recovery, who is told about it on their check-in screen.</p>
        <p><strong>Professionals you connect.</strong> A parent or partner decides whether to connect a professional (for example an interventionist, treatment center, therapist, coach, sober living or outpatient program). What the practice can see depends on whether it provides (pays for) your family’s FamilyBridge. The app tells you which before you connect.</p>
        <p><strong>A practice that doesn't provide your FamilyBridge.</strong> Your family chooses exactly which areas it can see, area by area: money, meetings, appointments, medications, drug tests, your plan, check-ins and family chat (off unless you turn it on). "Your plan" includes the family pact, Before you say yes answers, family meetings, the treatment plan, the trust ladder and your naloxone kits; family chat includes your Reach Out log. You can change these choices at any time.</p>
        <p><strong>A practice that provides your FamilyBridge.</strong> While it does, it automatically sees your family’s family-wide areas: money requests, the plan and boundaries, pacts, meetings, appointments, drug tests, daily check-ins and documents shared with the family, and its AI Assistant can use that information to help coach your family. What is each person’s own — their messages in family chat, conversation notes and outreach drafts, location check-ins, medications they share with the family, and documents they keep private — reaches the practice only if that person signs the practice’s release in the app. Everyone decides for themselves; if you don’t sign, you keep using FamilyBridge, including the family chat, and what’s yours stays hidden from the practice. Your family can see whose information is shared. A release covers what you write from when you sign (nothing from before) and, while it stands, your shared medications and private documents. You can take it back at any time; from then on nothing new you write is shared and your medications and private documents stop being shared, but what you wrote while it stood stays visible to the practice for as long as your family is connected with it. A release ends when your family’s connection with that practice ends, and reconnecting asks everyone again. If the practice stops paying, it sees nothing under releases until it pays again. Family Insights sum up everyone, so they are shared with the practice only once everyone in the family with an account has signed. To stop all sharing with the practice, disconnect.</p>
        <p><strong>Everyone at the practice.</strong> When a practice can see your family chat, every professional on its team can read it and post in it (clearly labeled), so someone can step in when the person responsible for your family is away. Your family can see a log of when professionals open your family’s file, and you can disconnect at any time.</p>
        <p><strong>Handoffs between professionals.</strong> When a professional refers your family to another provider, nothing is shared until a parent or partner approves and chooses what the new provider can see. If your care history is included, the new provider can read earlier providers' session summaries, tasks and messages — and their clinical notes only if the referring professional chose to share them.</p>
        <p><strong>Intake.</strong> The intake answers and signed service agreement you submit to a practice go to that practice only, and you can still read them.</p>
        <p><strong>Progress reports for others.</strong> A practice can make a progress report about your family for someone outside FamilyBridge — such as a court, probation, an employer, an insurer or a referring program — only under an authorization the person in recovery signs on their own phone, naming who receives it, what it may include and an end date. A report can include only what the authorization allows and what your family shares with that practice, and may cover any dates the practice chooses, including before the authorization was signed. Every report is logged before it is made and appears in your family’s access log, and your family’s members who use the app can see each report made. Reports are never shared outside the app with anyone except the recipient the person in recovery named. The person in recovery can take an authorization back at any time, but a report already sent can’t be unsent: once it leaves FamilyBridge, it is outside our control and the recipient’s own rules apply.</p>
        <p><strong>Find a professional.</strong> Listings in the directory are professionals at practices that pay for FamilyBridge, and they are shown only to signed-in users. When you ask a listed professional for help, your first name, your family’s name, your questionnaire answers and your message are shared with that professional and their practice’s owner (the app says so before you send). If they accept, you get the practice’s connect code; your family still chooses whether to connect. Practices see only totals of how often each of their professionals was shown (each person searching is counted once a day), how many families asked for help and how many they accepted — never who searched.</p>
        <p><strong>Reviews.</strong> Reviews you write are shown to signed-in users with your first name and state. The professional you review and their practice’s owner can read and publicly reply to your review. FamilyBridge doesn’t show them which family wrote it, though your first name and state may let them recognize you.</p>
        <p><strong>Once a practice has your information.</strong> What a practice receives becomes part of its own records, and its own privacy duties apply to what it keeps and passes on.</p>
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
        <p>FamilyBridge's coaching features use <strong>Claude, an AI model made by Anthropic</strong>. Before any of your information is sent to Anthropic by the AI features you use, the app asks for your permission, and you can turn AI features off at any time in <strong>Tools → Family Members → Privacy &amp; account</strong> (professionals: the Practice tab). Everything else in FamilyBridge works without AI.</p>
        <p><strong>Practices' AI.</strong> Professionals use the AI Assistant and progress-note drafts only after agreeing to AI themselves. For a practice that doesn't provide your FamilyBridge, your family decides whether its AI Assistant may read what you share with it. A practice that provides your FamilyBridge can use its AI Assistant with what it sees of your family (the family-wide areas, plus each person’s own information under their release); the app says so before you connect, and the release says so before you sign.</p>
        <p>When you use an AI feature, we send only what that feature needs:</p>
        <div className="overflow-x-auto">
          <table>
            <thead><tr><th>Feature</th><th>What's sent</th></tr></thead>
            <tbody>
              <tr><td>AI Coach</td><td>Your question, your recent coaching conversation, a short description of your family, and any screenshots you attach</td></tr>
              <tr><td>Live Coaching</td><td>The text of the recent conversation (never audio)</td></tr>
              <tr><td>Practice a conversation</td><td>What you type or say during practice, the topic you choose, your loved one’s first name and relationship, and a few of your family’s boundaries (to Anthropic). If you choose to hear replies out loud, the text of the AI’s replies — never your voice — is sent to ElevenLabs to create the spoken voice. Your practice and its feedback are saved privately for you — no one else in your family, including the person in recovery, and no professional can see them.</td></tr>
              <tr><td>Reach Out (“Help me say it kindly”)</td><td>The message you're writing, or the message your loved one sent you; your relationship to them; their first name and relationship; and where they are right now (still using, in treatment or early recovery)</td></tr>
              <tr><td>Lab report and aftercare reading</td><td>The photo, PDF or text you choose</td></tr>
              <tr><td>Letter feedback</td><td>The letter text</td></tr>
              <tr><td>Family Insights</td><td>The family's last 30 days of chat, conversation notes, check-ins, agreements, goals, appointments, tests and money requests — only if a family helper turns Family Insights on</td></tr>
              <tr><td>Professional AI Assistant</td><td>The professional's question and the information that practice can see of the family</td></tr>
              <tr><td>Progress-note drafts (professionals)</td><td>The professional's recap of their latest session with the family and what the family recorded in the two weeks before it; the draft is for the professional to review and edit</td></tr>
            </tbody>
          </table>
        </div>
        <p>Anthropic processes this information to generate the response on our behalf and <strong>does not use it to train its models</strong>. ElevenLabs only turns the AI’s own practice replies into speech. AI output can be wrong and is not medical, legal or clinical advice.</p>
      </>
    ),
  },
  {
    id: 'providers',
    title: 'Service providers',
    body: <p>We use a small number of providers to run FamilyBridge, each only for its purpose: Supabase (secure database, file storage and sign-in), Anthropic (AI features you've agreed to), ElevenLabs (spoken voices in conversation practice), Apple and RevenueCat (subscriptions and purchases), Square (online payments for professional plans), Expo (push notifications) and Resend (email).</p>,
  },
  {
    id: 'security',
    title: 'Security',
    body: <p>Your information is encrypted in transit and at rest. Access rules are enforced on our servers for every record — not just in the app — so people see only what they've been given access to. Receipts and documents are stored privately and shown through short-lived links. No system is perfectly secure, but we work hard to protect your information and will notify you as required by law if a breach affects you.</p>,
  },
  {
    id: 'choices',
    title: 'Your choices and rights',
    body: (
      <>
        <ul>
          <li><strong>See and correct</strong> your information in the app at any time.</li>
          <li><strong>Control sharing</strong> with professionals (what they see, or disconnect), with AI (Settings → Privacy &amp; account), and through releases and authorizations, which are always your choice and which you can take back in the app at any time.</li>
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
    description="How FamilyBridge handles your family's information: what we collect, who can see it, professionals and releases, Find a professional, AI features, and deleting your account."
    updated="November 20, 2026"
    intro={<p>FamilyBridge helps families affected by a loved one's substance use stay connected, accountable and supported — together with the professionals they choose. This policy explains what we collect, how we use it, who can see it, and the choices you have.</p>}
    sections={sections}
  />
);

export default PrivacyPolicy;
