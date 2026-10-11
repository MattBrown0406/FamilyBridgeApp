import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { indexableRoutes, movedRoutes, noIndexRoutes } from './site-routes.mjs';
import { loadPosts, postSummaries, SITE_URL } from './blog/content.mjs';
import { blogFiles, blogSitemapEntries, renderMoved } from './blog/render.mjs';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(projectRoot, 'dist');
const baseUrl = 'https://familybridgeapp.com';


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

let template = await readFile(join(distDir, 'index.html'), 'utf8');
const posts = loadPosts(projectRoot);
if (posts.length) {
  template = template.replace('</head>', `  <link rel="alternate" type="application/rss+xml" title="FamilyBridge blog" href="${SITE_URL}/blog/rss.xml" />\n  </head>`);
}

// Clean URLs: /path is served from path.html, and /path/ from path/index.html.
const writePage = async (path, html) => {
  if (path === '/') {
    await writeFile(join(distDir, 'index.html'), html, 'utf8');
    return;
  }
  const routePath = path.slice(1);
  for (const file of [join(distDir, `${routePath}.html`), join(distDir, routePath, 'index.html')]) {
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, html, 'utf8');
  }
};

for (const route of [...indexableRoutes, ...noIndexRoutes]) {
  await writePage(route.path, renderRouteHtml(template, route, noIndexRoutes.includes(route)));
}
for (const route of movedRoutes) {
  await writePage(route.path, renderMoved(route.to));
}

// The blog: every article, topic, author page and the RSS feed as complete static pages (see scripts/blog/).
const analytics = template.match(/<!-- Google tag \(gtag\.js\) -->[\s\S]*?<\/script>\s*<script>[\s\S]*?<\/script>/)?.[0] ?? '';
const blog = blogFiles(posts, { analytics: analytics ? `${analytics}\n` : '' });
for (const [path, page] of blog) {
  if (path.endsWith('.xml')) await writeFile(join(distDir, path.slice(1)), page.body, 'utf8');
  else await writePage(path, page.body);
}

// The sitemap lists every indexable page, articles included, so new articles are found on the next crawl.
const sitemapEntries = [...indexableRoutes, ...blogSitemapEntries(posts)];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries.map((entry) => `  <url>
    <loc>${baseUrl}${entry.path}</loc>${entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : ''}
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;
await writeFile(join(distDir, 'sitemap.xml'), sitemap, 'utf8');

// AI assistants read llms.txt; list the articles there too.
if (posts.length) {
  const section = `\n## Guides for families (blog)\n\nPractical guides by Matt Brown, certified interventionist, for families of someone with a substance use problem: ${SITE_URL}/blog\n\n${postSummaries(posts).map((post) => `- [${post.seoTitle}](${SITE_URL}${post.path}): ${post.description}`).join('\n')}\n`;
  for (const file of ['llms.txt', 'llms-full.txt']) {
    const path = join(distDir, file);
    await writeFile(path, `${(await readFile(path, 'utf8')).trimEnd()}\n${section}`, 'utf8');
  }
}

console.log(`Generated static pages for ${indexableRoutes.length} indexable, ${noIndexRoutes.length} noindex and ${movedRoutes.length} moved routes, and ${posts.length} blog articles (${blog.size} blog files); sitemap has ${sitemapEntries.length} URLs.`);
