import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { indexableRoutes, movedRoutes, noIndexRoutes } from './site-routes.mjs';
import { loadPosts } from './blog/content.mjs';
import { blogSitemapEntries } from './blog/render.mjs';

const projectRoot = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const distDir = join(projectRoot, 'dist');
const siteUrl = 'https://familybridgeapp.com';
const failures = [];

const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

const decode = (value) => value.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&lt;', '<').replaceAll('&gt;', '>');
const match = (html, pattern) => decode(html.match(pattern)?.[1] ?? '');
const fileFor = (path) => (path === '/' ? join(distDir, 'index.html') : join(distDir, `${path.slice(1)}.html`));

const posts = loadPosts(projectRoot, { log: { warn: () => {} } });
const blogEntries = blogSitemapEntries(posts);
const sitemap = await readFile(join(distDir, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((item) => item[1]);
const expected = [...indexableRoutes.map((route) => route.path), ...blogEntries.map((entry) => entry.path)].map((path) => `${siteUrl}${path}`);

assert(sitemapUrls.length === expected.length, `Expected ${expected.length} sitemap URLs, found ${sitemapUrls.length}`);
assert(new Set(sitemapUrls).size === sitemapUrls.length, 'Sitemap contains duplicate URLs');
assert(sitemapUrls.every((url) => url.startsWith(`${siteUrl}/`)), 'Sitemap contains a noncanonical host');
for (const url of expected) assert(sitemapUrls.includes(url), `${url} is missing from the sitemap`);

// Pages a link on the site may point to.
const knownPaths = new Set([
  ...indexableRoutes.map((route) => route.path),
  ...noIndexRoutes.map((route) => route.path),
  ...movedRoutes.map((route) => route.path),
  '/blog', '/blog/rss.xml', '/blog/author/matt-brown',
  ...posts.map((post) => post.path),
]);

for (const url of sitemapUrls) {
  const path = new URL(url).pathname;
  const outputPath = fileFor(path);
  try {
    await access(outputPath);
  } catch {
    failures.push(`${path}: no page at ${outputPath}`);
    continue;
  }
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

  const types = [];
  for (const [, jsonLd] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const data = JSON.parse(jsonLd);
      for (const node of data['@graph'] ?? [data]) types.push(node['@type']);
    } catch (error) {
      failures.push(`${path}: invalid JSON-LD (${error.message})`);
    }
  }

  if (path.startsWith('/blog')) {
    assert((html.match(/<h1[\s>]/g) ?? []).length === 1, `${path}: needs exactly one <h1>`);
    assert(types.includes('BreadcrumbList'), `${path}: BreadcrumbList structured data is missing`);
    for (const [, href] of html.matchAll(/<a [^>]*href="(\/[^"#?]*)/g)) {
      const target = href.length > 1 ? href.replace(/\/$/, '') : href;
      assert(knownPaths.has(target) || target.startsWith('/blog/topic/'), `${path}: links to ${href}, which isn't a page on the site`);
    }
  }
}

for (const post of posts) {
  const html = await readFile(fileFor(post.path), 'utf8');
  assert(html.includes('"@type":"BlogPosting"'), `${post.path}: BlogPosting structured data is missing`);
  assert(html.includes(`<link rel="canonical" href="${post.url}">`), `${post.path}: canonical is wrong`);
  assert(!post.faq.length || html.includes('"@type":"FAQPage"'), `${post.path}: FAQPage structured data is missing`);
  assert(html.includes('<article'), `${post.path}: the article text isn't in the page`);
}
if (posts.length) {
  const rss = await readFile(join(distDir, 'blog', 'rss.xml'), 'utf8');
  assert(rss.includes('<rss') && posts.every((post) => rss.includes(`<link>${post.url}</link>`) || posts.indexOf(post) >= 50), 'blog/rss.xml is missing articles');
  for (const file of ['llms.txt', 'llms-full.txt']) {
    const text = await readFile(join(distDir, file), 'utf8');
    assert(posts.every((post) => text.includes(post.url)), `${file} doesn't list every article`);
  }
}

for (const route of movedRoutes) {
  assert(!sitemapUrls.includes(`${siteUrl}${route.path}`), `${route.path}: moved page appears in sitemap`);
  const html = await readFile(fileFor(route.path), 'utf8');
  assert(html.includes(`<meta http-equiv="refresh" content="0; url=${route.to}">`), `${route.path}: redirect to ${route.to} is missing`);
}

const noIndexPaths = noIndexRoutes.map((route) => route.path);
for (const path of noIndexPaths) {
  assert(!sitemapUrls.includes(`${siteUrl}${path}`), `${path}: noindex route appears in sitemap`);
  const html = await readFile(fileFor(path), 'utf8');
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
assert(!/^Disallow: \/blog/m.test(robots), 'robots.txt blocks the blog');

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

console.log(`SEO validation passed: ${sitemapUrls.length} indexable URLs (${posts.length} blog articles), ${noIndexPaths.length} protected noindex routes, ${movedRoutes.length} moved routes, valid canonicals, metadata, JSON-LD, internal links, robots, response headers, and crawler files.`);
