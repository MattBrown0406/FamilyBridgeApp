import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(projectRoot, 'dist');
const baseUrl = 'https://familybridgeapp.com';

const indexableRoutes = [
  {
    path: '/',
    title: 'FamilyBridge — Family Recovery Support and Coordination',
    description: 'FamilyBridge helps families support a loved one in recovery through communication, coordinated actions, clear boundaries, and authorized professional collaboration.',
  },
  {
    path: '/family-purchase',
    title: 'Family Recovery Support Plan | FamilyBridge',
    description: 'Explore the FamilyBridge family plan for shared communication, boundaries, decisions, recovery support actions, and coordinated follow-through.',
  },
  {
    path: '/for-providers',
    title: 'FamilyBridge for Treatment Providers',
    description: 'FamilyBridge helps authorized treatment teams collaborate with families through privacy-conscious communication, documented actions, care transitions, and follow-through.',
  },
  {
    path: '/provider-purchase',
    title: 'Recovery Support Software for Providers | FamilyBridge',
    description: 'Explore FamilyBridge provider plans for authorized family collaboration, structured handoffs, documented support actions, and privacy-conscious coordination.',
  },
  {
    path: '/demo',
    title: 'FamilyBridge Product Demo',
    description: 'See how FamilyBridge organizes family communication, shared decisions, recovery support actions, financial coordination, and authorized professional collaboration.',
  },
  {
    path: '/meetings',
    title: 'Recovery Meeting Finder and Check-Ins | FamilyBridge',
    description: 'Find recovery meetings and use FamilyBridge check-ins to keep family support informed without treating attendance as proof of sobriety.',
  },
  {
    path: '/enabling-exercise',
    title: 'Family Enabling Patterns Exercise | FamilyBridge',
    description: 'Use a guided FamilyBridge exercise to reflect on enabling patterns, boundaries, and healthier ways to support a loved one affected by addiction.',
  },
  {
    path: '/features/fiis-intelligence',
    title: 'AI-Assisted Family Recovery Insights | FamilyBridge',
    description: 'Learn how FIIS organizes authorized family activity and documented recovery-support patterns for compassionate, human-reviewed next steps.',
  },
  {
    path: '/features/recovery-trajectory',
    title: 'Recovery Progress and Concern Tracking | FamilyBridge',
    description: 'Organize documented recovery progress, family observations, and shared concerns in one privacy-conscious FamilyBridge view.',
  },
  {
    path: '/features/document-analysis',
    title: 'Recovery Support Document Analysis | FamilyBridge',
    description: 'Extract boundaries, commitments, and action items from authorized intervention letters and aftercare documents for human review.',
  },
  {
    path: '/features/medication-compliance',
    title: 'Medication Consistency Support | FamilyBridge',
    description: 'Explore user-directed medication scheduling and consistency tools that support coordination without prescribing or replacing medical advice.',
  },
  {
    path: '/features/financial-coordination',
    title: 'Family Financial Coordination in Recovery | FamilyBridge',
    description: 'Coordinate family financial requests, shared decisions, pledges, receipts, and boundaries with greater transparency during recovery.',
  },
  {
    path: '/features/care-transitions',
    title: 'Privacy-Conscious Recovery Care Transitions | FamilyBridge',
    description: 'Support authorized provider handoffs with clear next steps, limited information sharing, consent controls, and documented follow-through.',
  },
  {
    path: '/features/conversation-coaching',
    title: 'Family Recovery Conversation Coaching | FamilyBridge',
    description: 'Use AI-assisted prompts for calmer, compassionate, non-shaming family communication during difficult recovery conversations.',
  },
  {
    path: '/support',
    title: 'FamilyBridge Support',
    description: 'Get help with FamilyBridge accounts, family coordination tools, privacy questions, and product support.',
  },
  {
    path: '/privacy',
    title: 'Privacy Policy | FamilyBridge',
    description: 'Read how FamilyBridge handles personal information, family data, authorized professional access, and privacy choices.',
  },
  {
    path: '/terms',
    title: 'Terms of Service | FamilyBridge',
    description: 'Read the terms governing use of the FamilyBridge recovery support and family coordination platform.',
  },
];

const noIndexRoutes = [
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

const privateNoIndexPaths = [
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
];

noIndexRoutes.push(...privateNoIndexPaths.map((path) => ({
  path,
  title: 'Private FamilyBridge Workspace',
  description: 'This FamilyBridge route is private, transactional, invitation-based, or intended for authenticated workspace use.',
})));

const escapeHtml = (value) => value
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

const setNamedMeta = (html, name, content) => html.replace(
  new RegExp(`<meta name="${name}" content="[^"]*" \\/>`),
  `<meta name="${name}" content="${escapeHtml(content)}" />`,
);

const setPropertyMeta = (html, property, content) => html.replace(
  new RegExp(`<meta property="${property}" content="[^"]*" \\/>`),
  `<meta property="${property}" content="${escapeHtml(content)}" />`,
);

const renderRouteHtml = (template, route, noIndex = false) => {
  const url = `${baseUrl}${route.path === '/' ? '/' : route.path}`;
  let html = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(route.title)}</title>`)
    .replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${url}" />`);

  html = setNamedMeta(html, 'description', route.description);
  html = setNamedMeta(
    html,
    'robots',
    noIndex ? 'noindex, nofollow, noarchive' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  );
  html = setPropertyMeta(html, 'og:title', route.title);
  html = setPropertyMeta(html, 'og:description', route.description);
  html = setPropertyMeta(html, 'og:url', url);
  html = setNamedMeta(html, 'twitter:title', route.title);
  html = setNamedMeta(html, 'twitter:description', route.description);

  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: route.title,
    description: route.description,
    url,
    isPartOf: {
      '@type': 'WebSite',
      name: 'FamilyBridge',
      url: baseUrl,
    },
  };

  return html.replace(
    /<!-- JSON-LD Structured Data - WebPage -->[\s\S]*?<\/script>/,
    `<!-- JSON-LD Structured Data - WebPage -->\n    <script type="application/ld+json">\n    ${JSON.stringify(webPageSchema, null, 2).replaceAll('\n', '\n    ')}\n    </script>`,
  );
};

const template = await readFile(join(distDir, 'index.html'), 'utf8');

for (const route of [...indexableRoutes, ...noIndexRoutes]) {
  const rendered = renderRouteHtml(template, route, noIndexRoutes.includes(route));
  if (route.path === '/') {
    await writeFile(join(distDir, 'index.html'), rendered, 'utf8');
    continue;
  }

  const routePath = route.path.slice(1);
  const cleanUrlPath = join(distDir, `${routePath}.html`);
  const directoryIndexPath = join(distDir, routePath, 'index.html');
  await mkdir(dirname(cleanUrlPath), { recursive: true });
  await mkdir(dirname(directoryIndexPath), { recursive: true });
  await writeFile(cleanUrlPath, rendered, 'utf8');
  await writeFile(directoryIndexPath, rendered, 'utf8');
}

console.log(`Generated static metadata for ${indexableRoutes.length} indexable and ${noIndexRoutes.length} noindex existing routes.`);
