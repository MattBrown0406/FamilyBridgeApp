// The site's routes, shared by the build (generate-static-route-metadata.mjs) and its checks (validate-seo.mjs).

// Pages search engines should list. Titles and descriptions match each page's <SEOHead>, so the HTML a crawler gets
// first says the same thing as the page after it loads.
export const indexableRoutes = [
  {
    path: '/',
    lastmod: '2026-10-11',
    title: 'FamilyBridge — App for Families of Someone with Addiction',
    description: 'Help a loved one with addiction as one family: see where everyone stands, agree on one plan, and get coaching for hard conversations. Free on iPhone.',
    changefreq: 'weekly',
    priority: '1.0',
  },
  {
    path: '/for-providers',
    lastmod: '2026-10-11',
    title: 'FamilyBridge for Interventionists & Treatment Providers',
    description: 'A consent-based caseload, family chat, AI summaries, handoffs between levels of care and white label for the families you serve. From $149/month.',
    changefreq: 'monthly',
    priority: '0.9',
  },
  {
    path: '/enabling-exercise',
    lastmod: '2026-10-11',
    title: 'Am I Enabling? A Free Exercise for Families | FamilyBridge',
    description: 'Helping or enabling? Eight honest questions to tell a real crisis from chaos — for parents, partners and families of someone with addiction.',
    changefreq: 'monthly',
    priority: '0.7',
  },
  {
    path: '/meetings',
    lastmod: '2026-10-11',
    title: 'Al-Anon, Nar-Anon & Recovery Meeting Finder | FamilyBridge',
    description: 'Find Al-Anon, Nar-Anon, CRAFT, AA and NA meetings near you or online — support groups for families of someone with addiction, and for the person in recovery.',
    changefreq: 'monthly',
    priority: '0.6',
  },
  {
    path: '/support',
    lastmod: '2026-09-25',
    title: 'FamilyBridge Support',
    description: 'Help with FamilyBridge: family setup, passwords, deleting your account, subscriptions, SOS, working with professionals, and privacy.',
    changefreq: 'monthly',
    priority: '0.5',
  },
  {
    path: '/privacy',
    lastmod: '2026-09-26',
    title: 'Privacy Policy | FamilyBridge',
    description: 'How FamilyBridge handles your family\'s information: what we collect, who can see it, AI features with your permission, and deleting your account.',
    changefreq: 'yearly',
    priority: '0.3',
  },
  {
    path: '/terms',
    lastmod: '2026-09-29',
    title: 'Terms of Service | FamilyBridge',
    description: 'The terms for using FamilyBridge: families, professionals, subscriptions and SOS sessions, AI features, drug-test results, and your account.',
    changefreq: 'yearly',
    priority: '0.3',
  },
  {
    path: '/eula',
    lastmod: '2026-09-25',
    title: 'End User License Agreement | FamilyBridge',
    description: 'The FamilyBridge End User License Agreement for the iOS app: your license, maintenance and support, warranty, and Apple\'s role as third-party beneficiary.',
    changefreq: 'yearly',
    priority: '0.3',
  },
];

// Pages from the previous web app that now live elsewhere (see the LegacyRedirect routes in src/App.tsx). The host
// can't send server redirects, so each gets an instant redirect page, which search engines treat as a permanent move.
export const movedRoutes = [
  { path: '/family-purchase', to: '/#pricing' },
  { path: '/provider-purchase', to: '/for-providers' },
  { path: '/features/fiis-intelligence', to: '/#insights' },
  { path: '/features/recovery-trajectory', to: '/for-providers' },
  { path: '/features/document-analysis', to: '/#features' },
  { path: '/features/medication-compliance', to: '/#features' },
  { path: '/features/financial-coordination', to: '/#features' },
  { path: '/features/care-transitions', to: '/for-providers' },
  { path: '/features/conversation-coaching', to: '/#features' },
];

export const noIndexRoutes = [
  {
    path: '/demo',
    title: 'FamilyBridge Product Demo',
    description: 'See how FamilyBridge organizes family communication, shared decisions, recovery support actions, financial coordination, and authorized professional collaboration.',
  },
  {
    path: '/demo/family',
    title: 'Family Dashboard Demo | FamilyBridge',
    description: 'Interactive demonstration of the FamilyBridge family workspace using fictional sample data.',
  },
  {
    path: '/demo/provider',
    title: 'Provider Dashboard Demo | FamilyBridge',
    description: 'Interactive demonstration of the FamilyBridge provider workspace using fictional sample data.',
  },
  {
    path: '/features/provider-outcomes',
    title: 'Provider Outcomes Demo | FamilyBridge',
    description: 'Demonstration of privacy-thresholded provider reporting using fictional sample data.',
  },
  {
    path: '/features/intervention-outcomes',
    title: 'Intervention Outcomes Demo | FamilyBridge',
    description: 'Demonstration of intervention outcome reporting using fictional sample data.',
  },
  {
    path: '/features/fiis-guidance',
    title: 'FIIS Guidance Demo | FamilyBridge',
    description: 'Demonstration of FIIS guidance workflows using fictional sample data.',
  },
];

export const privateNoIndexPaths = [
  '/auth',
  '/dashboard',
  '/moderator-dashboard',
  '/subscription',
  '/provider-admin',
  '/provider-workspace',
  '/professional-invite',
  '/provider-coordination',
  '/family-setup',
  '/join',
  '/join-family',
  '/moderator-purchase',
  '/super-admin',
  '/sign-hipaa',
  '/intervention-readiness',
  '/intervention-execution',
  '/post-intervention',
  '/accountability-engine',
  '/outcome-predictions',
  '/ai-learning',
  '/ai-learning/stage-2',
  '/ai-learning/governance',
  '/input-reconciliation',
  '/update-payment',
  '/practice-billing',
  '/practice-billing/complete',
];

noIndexRoutes.push(...privateNoIndexPaths.map((path) => ({
  path,
  title: 'Private FamilyBridge Workspace',
  description: 'This FamilyBridge route is private, transactional, invitation-based, or intended for authenticated workspace use.',
})));
