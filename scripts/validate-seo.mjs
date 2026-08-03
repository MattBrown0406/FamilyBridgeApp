import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const distDir = join(projectRoot, 'dist');
const siteUrl = 'https://familybridgeapp.com';
const failures = [];

const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

const match = (html, pattern) => html.match(pattern)?.[1] ?? '';
const sitemap = await readFile(join(distDir, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((item) => item[1]);

assert(sitemapUrls.length === 17, `Expected 17 sitemap URLs, found ${sitemapUrls.length}`);
assert(new Set(sitemapUrls).size === sitemapUrls.length, 'Sitemap contains duplicate URLs');
assert(sitemapUrls.every((url) => url.startsWith(`${siteUrl}/`)), 'Sitemap contains a noncanonical host');

for (const url of sitemapUrls) {
  const path = new URL(url).pathname;
  const outputPath = path === '/'
    ? join(distDir, 'index.html')
    : join(distDir, `${path.slice(1)}.html`);
  await access(outputPath);
  const html = await readFile(outputPath, 'utf8');
  const title = match(html, /<title>([\s\S]*?)<\/title>/);
  const description = match(html, /<meta name="description" content="([^"]*)"/);
  const canonical = match(html, /<link rel="canonical" href="([^"]*)"/);
  const robots = match(html, /<meta name="robots" content="([^"]*)"/);
  const googlebot = match(html, /<meta name="googlebot" content="([^"]*)"/);
  const ogUrl = match(html, /<meta property="og:url" content="([^"]*)"/);

  assert(title.length >= 20 && title.length <= 65, `${path}: title length is ${title.length}`);
  assert(description.length >= 70 && description.length <= 170, `${path}: description length is ${description.length}`);
  assert(canonical === url, `${path}: canonical is ${canonical || 'missing'}`);
  assert(ogUrl === url, `${path}: og:url is ${ogUrl || 'missing'}`);
  assert(robots.includes('index, follow') && !robots.includes('noindex'), `${path}: indexable robots directive is missing`);
  assert(!googlebot.includes('noindex'), `${path}: Googlebot directive conflicts with indexable robots directive`);

  for (const [, jsonLd] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(jsonLd);
    } catch (error) {
      failures.push(`${path}: invalid JSON-LD (${error.message})`);
    }
  }
}

const noIndexPaths = [
  '/demo/family',
  '/demo/provider',
  '/features/provider-outcomes',
  '/features/intervention-outcomes',
  '/features/fiis-guidance',
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

for (const path of noIndexPaths) {
  assert(!sitemapUrls.includes(`${siteUrl}${path}`), `${path}: noindex route appears in sitemap`);
  const html = await readFile(join(distDir, `${path.slice(1)}.html`), 'utf8');
  const robots = match(html, /<meta name="robots" content="([^"]*)"/);
  const googlebot = match(html, /<meta name="googlebot" content="([^"]*)"/);
  const canonical = match(html, /<link rel="canonical" href="([^"]*)"/);
  assert(robots.includes('noindex'), `${path}: noindex directive is missing`);
  assert(!googlebot || googlebot.includes('noindex'), `${path}: Googlebot directive conflicts with noindex`);
  assert(canonical === `${siteUrl}${path}`, `${path}: canonical is missing or incorrect`);
}

const robots = await readFile(join(distDir, 'robots.txt'), 'utf8');
assert(robots.includes(`Sitemap: ${siteUrl}/sitemap.xml`), 'robots.txt does not advertise the sitemap');
for (const privatePath of ['/auth', '/dashboard', '/family/', '/professional-invite', '/professional-family/', '/provider-admin']) {
  assert(robots.includes(`Disallow: ${privatePath}`), `robots.txt does not protect ${privatePath}`);
}

const headers = await readFile(join(distDir, '_headers'), 'utf8');
for (const path of noIndexPaths) {
  assert(headers.includes(`\n${path}\n  X-Robots-Tag: noindex, nofollow, noarchive`), `${path}: X-Robots-Tag header is missing`);
}
for (const path of ['/family/*', '/professional-family/*', '/ai-learning/*']) {
  assert(headers.includes(`\n${path}\n  X-Robots-Tag: noindex, nofollow, noarchive`), `${path}: wildcard X-Robots-Tag header is missing`);
}

for (const file of ['llms.txt', 'llms-full.txt', 'og-image.png']) {
  await access(join(distDir, file));
}

if (failures.length) {
  console.error(`SEO validation failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`SEO validation passed: ${sitemapUrls.length} indexable routes, ${noIndexPaths.length} protected noindex routes, valid canonicals, metadata, JSON-LD, robots, response headers, and crawler files.`);
