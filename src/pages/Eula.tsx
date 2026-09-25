import { Link } from 'react-router-dom';
import { LegalPage, type LegalSection } from '@/components/site/LegalPage';

const sections: LegalSection[] = [
  {
    id: 'parties',
    title: 'Who this agreement is between',
    body: <p>This End User License Agreement (“EULA”) is between you and Freedom Interventions, LLC, the developer of FamilyBridge (“we”), and not with Apple Inc. (“Apple”). We, not Apple, are solely responsible for the FamilyBridge app (the “App”) and its content. This EULA works together with our <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>; if they conflict for the App as obtained from the App Store, this EULA controls.</p>,
  },
  {
    id: 'license',
    title: 'Your license',
    body: <p>We grant you a limited, non-exclusive, non-transferable, revocable license to download and use the App on Apple-branded products that you own or control, as permitted by the Usage Rules in Apple's Media Services Terms and Conditions. The App may also be accessed by other accounts associated with you through Family Sharing or volume purchasing. You may not rent, lease, lend, sell, redistribute or sublicense the App, or copy, modify, reverse-engineer or create derivative works of it, except as allowed by law.</p>,
  },
  {
    id: 'support',
    title: 'Maintenance and support',
    body: <p>We are solely responsible for providing maintenance and support for the App, as described on our <Link to="/support">Support page</Link> and as required by law. Apple has no obligation whatsoever to furnish any maintenance or support services for the App.</p>,
  },
  {
    id: 'warranty',
    title: 'Warranty',
    body: <p>To the extent any warranty applies to the App and it fails to conform to that warranty, you may notify Apple, and Apple will refund the purchase price (if any) you paid for the App. To the maximum extent permitted by law, Apple has no other warranty obligation with respect to the App, and any other claims, losses, liabilities, damages, costs or expenses attributable to a failure to conform to any warranty are our responsibility, subject to the disclaimers and limits in our Terms of Service.</p>,
  },
  {
    id: 'claims',
    title: 'Product claims',
    body: <p>We, not Apple, are responsible for addressing any claims by you or any third party relating to the App or your possession or use of it, including (i) product-liability claims; (ii) any claim that the App fails to conform to any applicable legal or regulatory requirement; and (iii) claims arising under consumer-protection, privacy or similar laws, including in connection with the App's use of HealthKit or HomeKit frameworks (the App does not currently use either).</p>,
  },
  {
    id: 'ip',
    title: 'Intellectual property',
    body: <p>If a third party claims that the App or your possession and use of it infringes that third party's intellectual-property rights, we, not Apple, are solely responsible for the investigation, defense, settlement and discharge of that claim.</p>,
  },
  {
    id: 'compliance',
    title: 'Legal compliance',
    body: <p>You represent and warrant that (i) you are not located in a country that is subject to a U.S. Government embargo or that has been designated by the U.S. Government as a “terrorist supporting” country; and (ii) you are not listed on any U.S. Government list of prohibited or restricted parties.</p>,
  },
  {
    id: 'third-party',
    title: 'Third-party terms',
    body: <p>You must comply with any applicable third-party terms when using the App — for example, your wireless data service agreement. Subscriptions and in-app purchases are also governed by Apple's terms.</p>,
  },
  {
    id: 'not-emergency',
    title: 'Not an emergency or medical service',
    body: <p>The App is a support and communication tool. It is not a medical, mental-health or emergency service, and SOS sessions are not an emergency response. If anyone may be in danger, call 911; for a mental-health crisis, call or text 988.</p>,
  },
  {
    id: 'termination',
    title: 'Termination',
    body: <p>This license lasts until ended by you or us. You can end it by deleting your account in the App (Settings → Privacy &amp; account → Delete my account) and removing the App. It ends automatically if you fail to comply with this EULA. When it ends, you must stop using the App.</p>,
  },
  {
    id: 'beneficiary',
    title: 'Apple as third-party beneficiary',
    body: <p>You and we acknowledge and agree that Apple and Apple's subsidiaries are third-party beneficiaries of this EULA, and that, upon your acceptance of this EULA, Apple will have the right (and will be deemed to have accepted the right) to enforce this EULA against you as a third-party beneficiary.</p>,
  },
  {
    id: 'contact',
    title: 'Contact',
    body: <p>Questions, complaints or claims about the App: Freedom Interventions, LLC · <a href="mailto:matt@freedominterventions.com">matt@freedominterventions.com</a> · 458-298-8003.</p>,
  },
];

const Eula = () => (
  <LegalPage
    title="End User License Agreement"
    path="/eula"
    description="The FamilyBridge End User License Agreement for the iOS app: your license, maintenance and support, warranty, and Apple's role as third-party beneficiary."
    updated="September 2026"
    intro={<p>This agreement covers your use of the FamilyBridge app downloaded from Apple's App Store.</p>}
    sections={sections}
  />
);

export default Eula;
