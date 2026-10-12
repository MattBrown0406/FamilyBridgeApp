// HTML for the blog pages. They're complete static pages (no JavaScript needed), so every reader, search engine and
// AI crawler gets the whole article on the first request.
import {
  APP_STORE_URL, AUTHORS, MIN_TOPIC_POSTS, SITE_URL, TOPICS, escapeHtml, longDate, relatedPosts, topicPostCounts,
} from './content.mjs';

const BRAND = 'FamilyBridge';
const DEFAULT_IMAGE = { url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: 'FamilyBridge — the app for families of someone with addiction' };
const INDEXABLE = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
const NOT_INDEXABLE = 'noindex, follow';

export const BLOG_TITLE = 'Family Addiction Blog: Guides From an Interventionist';
export const BLOG_DESCRIPTION = 'Practical guides for parents, spouses and families of someone with addiction: getting on the same page, boundaries, money, treatment and relapse.';

const withBrand = (title) => (title.length + BRAND.length + 3 <= 60 && !title.includes(BRAND) ? `${title} | ${BRAND}` : title);
const absolute = (path) => `${SITE_URL}${path}`;
const authorPath = (slug) => `/blog/author/${slug}`;
const topicPath = (key) => `/blog/topic/${key}`;
const jsonLd = (data) => `<script type="application/ld+json">${JSON.stringify(data).replaceAll('</', '<\\/')}</script>`;
const iso = (date) => `${date}T12:00:00+00:00`;
const rfc822 = (date) => new Date(`${date}T15:00:00Z`).toUTCString();

const ORGANIZATION = {
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: BRAND,
  url: SITE_URL,
  logo: { '@type': 'ImageObject', url: `${SITE_URL}/favicon.png`, width: 64, height: 64 },
  sameAs: [APP_STORE_URL],
};

const personSchema = (author) => ({
  '@type': 'Person',
  '@id': `${SITE_URL}${authorPath(author.slug)}#person`,
  name: author.name,
  url: absolute(authorPath(author.slug)),
  jobTitle: author.jobTitle,
  description: author.short,
  worksFor: { '@type': 'Organization', name: author.worksFor.name, url: author.worksFor.url },
  knowsAbout: author.knowsAbout,
});

const breadcrumbSchema = (items) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, item: absolute(item.path) })),
});

const CSS = `
:root{--bg:hsl(38 33% 95%);--fg:hsl(209 35% 16%);--card:#fff;--primary:hsl(186 59% 30%);--primary-dark:#134A51;--accent:hsl(30 83% 61%);--accent-ink:#9A5A1C;--muted:hsl(214 13% 40%);--border:hsl(38 21% 87%);--soft:hsl(180 29% 91%);color-scheme:light}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;scroll-padding-top:4.5rem}
body{margin:0;background:var(--bg);color:var(--fg);font:400 1rem/1.6 "DM Sans",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased}
a{color:var(--primary);text-underline-offset:.18em}
a:hover{color:var(--primary-dark)}
img{max-width:100%;height:auto}
.skip{position:absolute;left:-999px;top:0;background:var(--primary-dark);color:#fff;padding:.5rem 1rem;z-index:100}
.skip:focus{left:1rem}
.wrap{max-width:72rem;margin:0 auto;padding-inline:1rem}
.site-head{position:sticky;top:0;z-index:50;background:hsl(38 33% 95% / .92);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-bottom:1px solid var(--border)}
.site-head .wrap{height:3.5rem;display:flex;align-items:center;justify-content:space-between;gap:1rem}
.brand{display:flex;align-items:center;gap:.5rem;color:var(--fg);text-decoration:none;font-weight:800;font-size:1.125rem;letter-spacing:-.01em}
.brand img{width:32px;height:32px;border-radius:8px}
.site-nav{display:none;gap:1.5rem;font-size:.875rem;font-weight:500}
.site-nav a{color:var(--muted);text-decoration:none}
.site-nav a:hover,.site-nav a[aria-current]{color:var(--fg)}
.get-app{display:inline-flex;align-items:center;height:2.25rem;padding:0 .9rem;border-radius:.6rem;background:#000;color:#fff;font-size:.875rem;font-weight:600;text-decoration:none;white-space:nowrap}
.get-app:hover{color:#fff;opacity:.9}
@media (min-width:768px){.site-nav{display:flex}}
.crumbs{margin:1.5rem 0 0;font-size:.875rem;color:var(--muted)}
.crumbs ol{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:.25rem .5rem}
.crumbs li+li::before{content:"›";margin-right:.5rem;color:var(--border)}
.crumbs a{color:var(--muted);text-decoration:none}
.crumbs a:hover{color:var(--fg);text-decoration:underline}
.post{max-width:44rem;margin:0 auto;padding-bottom:2rem}
.eyebrow{margin:2rem 0 0;font-size:.8125rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
.eyebrow a{text-decoration:none}
h1{margin:.5rem 0 0;font-size:clamp(1.875rem,4.5vw,2.75rem);line-height:1.15;font-weight:800;letter-spacing:-.02em;text-wrap:balance}
.dek{margin:1rem 0 0;font-size:1.1875rem;line-height:1.55;color:var(--muted)}
.byline{display:flex;flex-wrap:wrap;gap:.25rem 1rem;margin:1.25rem 0 0;padding:1rem 0;border-block:1px solid var(--border);font-size:.9375rem;color:var(--muted)}
.byline a{font-weight:700;color:var(--fg);text-decoration:none}
.byline a:hover{text-decoration:underline}
.toc{margin:1.75rem 0 0;padding:1.1rem 1.25rem;background:var(--card);border:1px solid var(--border);border-radius:1rem}
.toc p{margin:0;font-weight:700;font-size:.9375rem}
.toc ol{margin:.6rem 0 0;padding-left:1.25rem;font-size:.9375rem;line-height:1.5}
.toc li+li{margin-top:.35rem}
.toc a{color:var(--fg);text-decoration:none}
.toc a:hover{color:var(--primary);text-decoration:underline}
.prose{margin-top:2rem;font-size:1.125rem;line-height:1.75}
.prose>:first-child{margin-top:0}
.prose p,.prose ul,.prose ol,.prose blockquote{margin:1.15rem 0}
.prose h2{margin:2.75rem 0 0;font-size:1.625rem;line-height:1.25;font-weight:800;letter-spacing:-.01em;text-wrap:balance}
.prose h3{margin:2rem 0 0;font-size:1.25rem;line-height:1.35;font-weight:700}
.prose h2+p,.prose h3+p,.prose h2+ul,.prose h3+ul,.prose h3+ol,.prose h2+ol{margin-top:.6rem}
.prose ul,.prose ol{padding-left:1.4rem}
.prose li{margin:.45rem 0;padding-left:.2rem}
.prose li::marker{color:var(--primary)}
.prose strong{font-weight:700}
.prose blockquote{margin-inline:0;padding:.25rem 0 .25rem 1.1rem;border-left:4px solid var(--accent)}
.cta{margin:2.5rem 0 0;padding:1.5rem;border-radius:1.25rem;background:var(--primary-dark);color:#fff}
.cta h2{margin:0;font-size:1.375rem;line-height:1.3;font-weight:800;text-wrap:balance}
.cta p{margin:.5rem 0 0;color:hsl(180 29% 88%)}
.cta .badge{display:inline-flex;align-items:center;gap:.6rem;margin-top:1.1rem;height:3rem;padding:0 1rem;border-radius:.75rem;background:#fff;color:#000;text-decoration:none}
.cta .badge span{display:flex;flex-direction:column;line-height:1;text-align:left}
.cta .badge small{font-size:.625rem;opacity:.8}
.cta .badge b{font-size:1.0625rem;font-weight:600;letter-spacing:-.01em}
.cta .more{display:inline-block;margin:1.1rem 0 0 1rem;color:#fff;font-weight:600}
.author{display:flex;gap:1rem;margin:2rem 0 0;padding:1.25rem;background:var(--card);border:1px solid var(--border);border-radius:1rem}
.author .mark{flex:none;width:3rem;height:3rem;border-radius:50%;background:var(--soft);color:var(--primary-dark);display:grid;place-items:center;font-weight:800}
.author h2{margin:0;font-size:1rem;font-weight:700}
.author p{margin:.35rem 0 0;font-size:.9375rem;color:var(--muted)}
.note{margin:1.5rem 0 0;font-size:.875rem;color:var(--muted)}
.related{max-width:72rem;margin:1rem auto 0;padding:2.5rem 0 3rem;border-top:1px solid var(--border)}
.related>h2,.list-head h2{margin:0;font-size:1.5rem;font-weight:800;letter-spacing:-.01em}
.cards{display:grid;gap:1rem;margin:1.25rem 0 0;padding:0;list-style:none}
@media (min-width:640px){.cards{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (min-width:1024px){.cards{grid-template-columns:repeat(3,minmax(0,1fr))}}
.card{display:flex;flex-direction:column;height:100%;padding:1.25rem;background:var(--card);border:1px solid var(--border);border-radius:1rem}
.card:hover{border-color:var(--primary)}
.card .topic{font-size:.75rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--primary)}
.card h3{margin:.4rem 0 0;font-size:1.125rem;line-height:1.35;font-weight:700}
.card h3 a{color:var(--fg);text-decoration:none}
.card h3 a::after{content:"";position:absolute;inset:0}
.card{position:relative}
.card p{margin:.5rem 0 0;font-size:.9375rem;color:var(--muted);flex:1}
.card .meta{margin-top:.9rem;font-size:.8125rem;color:var(--muted)}
.cover{margin:1.75rem 0 0}.cover img{display:block;width:100%;height:auto;aspect-ratio:16/9;object-fit:cover;border-radius:1rem}.card .thumb{display:block;width:100%;height:auto;aspect-ratio:16/9;object-fit:cover;border-radius:.75rem;margin:0 0 .875rem}
.hero{max-width:48rem;padding:2.5rem 0 0}
.hero h1{font-size:clamp(2rem,5vw,3rem)}
.hero p{margin:1rem 0 0;font-size:1.1875rem;color:var(--muted)}
.chips{display:flex;flex-wrap:wrap;gap:.5rem;margin:1.5rem 0 0;padding:0;list-style:none}
.chips a{display:inline-flex;align-items:center;gap:.4rem;height:2.25rem;padding:0 .9rem;border:1px solid var(--border);border-radius:999px;background:var(--card);color:var(--fg);font-size:.875rem;font-weight:600;text-decoration:none}
.chips a:hover,.chips a[aria-current]{border-color:var(--primary);color:var(--primary)}
.chips span{color:var(--muted);font-weight:500}
.list-head{margin:2.5rem 0 0}
.empty{margin:2rem 0 4rem;padding:2rem;background:var(--card);border:1px dashed var(--border);border-radius:1rem}
.profile{max-width:44rem;padding:2.5rem 0 0}
.profile p{font-size:1.125rem;line-height:1.7}
.site-foot{margin-top:2rem;border-top:1px solid var(--border);padding-block:2rem 2.5rem;font-size:.875rem;color:var(--muted)}
.site-foot nav{display:flex;flex-wrap:wrap;gap:.5rem 1.25rem}
.site-foot a{color:var(--muted);text-decoration:none}
.site-foot a:hover{color:var(--fg);text-decoration:underline}
.site-foot p{margin:1rem 0 0}
`.replace(/\n/g, '');

const APPLE_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>';

function head({ title, description, path, robots = INDEXABLE, type = 'website', image = DEFAULT_IMAGE, extraMeta = '', schema, analytics = '' }) {
  const url = absolute(path);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="${robots}">
<meta name="theme-color" content="#134A51">
<link rel="icon" href="/favicon.png" type="image/png">
<link rel="apple-touch-icon" href="/favicon.png">
<link rel="alternate" type="application/rss+xml" title="FamilyBridge blog" href="${SITE_URL}/blog/rss.xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400..800;1,9..40,400..800&display=swap" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400..800;1,9..40,400..800&display=swap"></noscript>
<meta property="og:type" content="${type}">
<meta property="og:site_name" content="FamilyBridge">
<meta property="og:locale" content="en_US">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${escapeHtml(image.url)}">
${image.width ? `<meta property="og:image:width" content="${image.width}">\n<meta property="og:image:height" content="${image.height}">\n` : ''}<meta property="og:image:alt" content="${escapeHtml(image.alt)}">
${extraMeta}<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${escapeHtml(image.url)}">
<meta name="twitter:image:alt" content="${escapeHtml(image.alt)}">
${jsonLd({ '@context': 'https://schema.org', '@graph': schema })}
<style>${CSS}</style>
${analytics}<script>try{sessionStorage.removeItem('fb-static-reload')}catch(e){}</script>
</head>`;
}

const siteHeader = (current = '') => `<a class="skip" href="#main">Skip to content</a>
<header class="site-head"><div class="wrap">
<a class="brand" href="/"><img src="/favicon.png" alt="" width="32" height="32">FamilyBridge</a>
<nav class="site-nav" aria-label="Main"><a href="/#features">Features</a><a href="/for-providers">For professionals</a><a href="/blog"${current === 'blog' ? ' aria-current="page"' : ''}>Blog</a><a href="/support">Support</a></nav>
<a class="get-app" href="${APP_STORE_URL}" rel="noopener" target="_blank">Get the app</a>
</div></header>`;

const siteFooter = () => `<footer class="site-foot"><div class="wrap">
<nav aria-label="Footer"><a href="/">Home</a><a href="/blog">Blog</a><a href="/#features">Features</a><a href="/for-providers">For professionals</a><a href="/enabling-exercise">Am I enabling?</a><a href="/meetings">Find a meeting</a><a href="/support">Support</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a></nav>
<p>If anyone is in immediate danger or you suspect an overdose, call 911. For a mental health or suicide crisis, call or text 988. SAMHSA's National Helpline is free and confidential, 24/7: 1-800-662-4357.</p>
<p>© ${new Date().getFullYear()} FamilyBridge · Freedom Interventions, LLC. FamilyBridge is a support app, not treatment, therapy, a crisis line or medical care.</p>
</div></footer>`;

const breadcrumbs = (items) => `<nav class="crumbs" aria-label="Breadcrumb"><ol>${items.map((item, i) => (i === items.length - 1
  ? `<li><span aria-current="page">${escapeHtml(item.name)}</span></li>`
  : `<li><a href="${item.path}">${escapeHtml(item.name)}</a></li>`)).join('')}</ol></nav>`;

const card = (post) => `<li class="card">${post.image ? `<img class="thumb" src="${escapeHtml(post.image)}" alt="" width="1600" height="912" loading="lazy" decoding="async">` : ''}<span class="topic">${escapeHtml(TOPICS[post.topic].name)}</span><h3><a href="${post.path}">${escapeHtml(post.title)}</a></h3><p>${escapeHtml(post.description)}</p><span class="meta"><time datetime="${post.date}">${longDate(post.date)}</time> · ${post.minutes} min read</span></li>`;

const topicChips = (posts, current = '') => {
  const counts = topicPostCounts(posts);
  return `<ul class="chips">${Object.entries(TOPICS).filter(([key]) => counts[key] > 0).map(([key, topic]) => `<li><a href="${topicPath(key)}"${key === current ? ' aria-current="page"' : ''}>${escapeHtml(topic.name)} <span>${counts[key]}</span></a></li>`).join('')}</ul>`;
};

const htmlDocument = (headHtml, bodyHtml) => `${headHtml}\n<body>\n${bodyHtml}\n</body>\n</html>\n`;

export function renderPost(post, posts, { analytics = '' } = {}) {
  const author = AUTHORS[post.author];
  const topic = TOPICS[post.topic];
  const image = post.image
    ? { url: post.image.startsWith('http') ? post.image : absolute(post.image), alt: post.imageAlt || post.title }
    : DEFAULT_IMAGE;
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Blog', path: '/blog' }, { name: topic.name, path: topicPath(post.topic) }, { name: post.seoTitle, path: post.path }];
  const schema = [
    {
      '@type': 'BlogPosting',
      '@id': `${post.url}#article`,
      headline: post.title.length <= 110 ? post.title : post.seoTitle,
      description: post.description,
      url: post.url,
      mainEntityOfPage: { '@type': 'WebPage', '@id': post.url },
      datePublished: iso(post.date),
      dateModified: iso(post.updated),
      author: { '@id': `${SITE_URL}${authorPath(author.slug)}#person` },
      publisher: { '@id': `${SITE_URL}/#organization` },
      isPartOf: { '@id': `${SITE_URL}/blog#blog` },
      image: [image.url],
      inLanguage: 'en-US',
      articleSection: topic.name,
      ...(post.keyword ? { keywords: post.keyword } : {}),
      wordCount: post.words,
      timeRequired: `PT${post.minutes}M`,
      isAccessibleForFree: true,
    },
    personSchema(author),
    ORGANIZATION,
    breadcrumbSchema(crumbs),
    ...(post.faq.length ? [{
      '@type': 'FAQPage',
      '@id': `${post.url}#faq`,
      mainEntity: post.faq.map((item) => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })),
    }] : []),
  ];
  const extraMeta = [
    `<meta name="author" content="${escapeHtml(author.name)}">`,
    `<meta property="article:published_time" content="${iso(post.date)}">`,
    `<meta property="article:modified_time" content="${iso(post.updated)}">`,
    `<meta property="article:author" content="${absolute(authorPath(author.slug))}">`,
    `<meta property="article:section" content="${escapeHtml(topic.name)}">`,
    ...(post.keyword ? [`<meta property="article:tag" content="${escapeHtml(post.keyword)}">`] : []),
  ].join('\n') + '\n';
  const toc = post.headings.length >= 3
    ? `<nav class="toc" aria-labelledby="toc-title"><p id="toc-title">In this guide</p><ol>${post.headings.map((h) => `<li><a href="#${h.id}">${escapeHtml(h.text)}</a></li>`).join('')}</ol></nav>`
    : '';
  const related = relatedPosts(post, posts);

  return htmlDocument(
    head({ title: withBrand(post.seoTitle), description: post.description, path: post.path, type: 'article', image, extraMeta, schema, analytics }),
    `${siteHeader('blog')}
<main id="main" class="wrap">
${breadcrumbs(crumbs)}
<article class="post">
<header>
<p class="eyebrow"><a href="${topicPath(post.topic)}">${escapeHtml(topic.name)}</a></p>
<h1>${escapeHtml(post.title)}</h1>
<p class="dek">${escapeHtml(post.description)}</p>
<div class="byline"><span>By <a href="${authorPath(author.slug)}" rel="author">${escapeHtml(author.name)}</a>, certified interventionist</span><span>Published <time datetime="${post.date}">${longDate(post.date)}</time></span>${post.updated !== post.date ? `<span>Updated <time datetime="${post.updated}">${longDate(post.updated)}</time></span>` : ''}<span>${post.minutes} min read</span></div>
</header>
${post.image ? `<figure class="cover"><img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.imageAlt || post.title)}" width="1600" height="912" fetchpriority="high" decoding="async"></figure>` : ''}
${toc}
<div class="prose">
${post.html}
</div>
<aside class="cta" aria-label="Get FamilyBridge">
<h2>Get your whole family on the same page</h2>
<p>FamilyBridge is a free iPhone and iPad app for families of someone with a substance use problem — before, during and after treatment.</p>
<a class="badge" href="${APP_STORE_URL}" rel="noopener" target="_blank" aria-label="Download FamilyBridge on the App Store">${APPLE_ICON}<span><small>Download on the</small><b>App Store</b></span></a><a class="more" href="/#features">See how it works</a>
</aside>
<section class="author" aria-labelledby="about-author"><div class="mark" aria-hidden="true">MB</div><div><h2 id="about-author">About the author</h2><p>${escapeHtml(author.short)} <a href="${authorPath(author.slug)}">More about ${escapeHtml(author.name.split(' ')[0])}</a></p></div></section>
<p class="note">This article is general information for families. It isn't medical, legal or mental health advice, and it doesn't replace care from a qualified professional. If anyone is in immediate danger or you suspect an overdose, call 911. For a mental health or suicide crisis, call or text 988.</p>
</article>
${related.length ? `<section class="related" aria-labelledby="related-title"><h2 id="related-title">More guides for families</h2><ul class="cards">${related.map(card).join('')}</ul></section>` : ''}
</main>
${siteFooter()}`,
  );
}

export function renderBlogIndex(posts, { analytics = '' } = {}) {
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Blog', path: '/blog' }];
  const schema = [
    {
      '@type': 'Blog',
      '@id': `${SITE_URL}/blog#blog`,
      name: 'The FamilyBridge Blog',
      description: BLOG_DESCRIPTION,
      url: absolute('/blog'),
      inLanguage: 'en-US',
      publisher: { '@id': `${SITE_URL}/#organization` },
      author: { '@id': `${SITE_URL}${authorPath('matt-brown')}#person` },
      blogPost: posts.slice(0, 50).map((post) => ({
        '@type': 'BlogPosting', '@id': `${post.url}#article`, headline: post.seoTitle, url: post.url, datePublished: iso(post.date),
      })),
    },
    personSchema(AUTHORS['matt-brown']),
    ORGANIZATION,
    breadcrumbSchema(crumbs),
  ];
  return htmlDocument(
    head({ title: withBrand(BLOG_TITLE), description: BLOG_DESCRIPTION, path: '/blog', robots: posts.length ? INDEXABLE : NOT_INDEXABLE, schema, analytics }),
    `${siteHeader('blog')}
<main id="main" class="wrap">
${breadcrumbs(crumbs)}
<section class="hero">
<h1>Help for families facing a loved one’s addiction</h1>
<p>Practical, honest guides from <a href="${authorPath('matt-brown')}">Matt Brown</a>, a certified interventionist with more than 20 years of experience helping families. How to get on the same page, set boundaries together, handle money requests, and support a loved one before, during and after treatment.</p>
${topicChips(posts)}
</section>
${posts.length
    ? `<section class="list-head" aria-labelledby="latest"><h2 id="latest">Latest guides</h2><ul class="cards">${posts.map(card).join('')}</ul></section>`
    : '<p class="empty">The first guides for families are on their way. In the meantime, try the free <a href="/enabling-exercise">“Am I enabling?” exercise</a> or <a href="/meetings">find a family support meeting</a>.</p>'}
</main>
${siteFooter()}`,
  );
}

export function renderTopic(key, posts, { analytics = '' } = {}) {
  const topic = TOPICS[key];
  const inTopic = posts.filter((post) => post.topic === key);
  const path = topicPath(key);
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Blog', path: '/blog' }, { name: topic.name, path }];
  const description = topic.intro.length > 160 ? `${topic.intro.slice(0, topic.intro.lastIndexOf(' ', 155))}…` : topic.intro;
  const schema = [
    {
      '@type': 'CollectionPage',
      '@id': `${absolute(path)}#page`,
      name: topic.title,
      description: topic.intro,
      url: absolute(path),
      isPartOf: { '@id': `${SITE_URL}/blog#blog` },
      inLanguage: 'en-US',
      mainEntity: { '@type': 'ItemList', itemListElement: inTopic.map((post, i) => ({ '@type': 'ListItem', position: i + 1, url: post.url, name: post.seoTitle })) },
    },
    ORGANIZATION,
    breadcrumbSchema(crumbs),
  ];
  return htmlDocument(
    head({ title: withBrand(topic.title), description, path, robots: inTopic.length >= MIN_TOPIC_POSTS ? INDEXABLE : NOT_INDEXABLE, schema, analytics }),
    `${siteHeader('blog')}
<main id="main" class="wrap">
${breadcrumbs(crumbs)}
<section class="hero">
<h1>${escapeHtml(topic.title)}</h1>
<p>${escapeHtml(topic.intro)}</p>
${topicChips(posts, key)}
</section>
${inTopic.length
    ? `<section class="list-head" aria-labelledby="in-topic"><h2 id="in-topic">${inTopic.length} ${inTopic.length === 1 ? 'guide' : 'guides'}</h2><ul class="cards">${inTopic.map(card).join('')}</ul></section>`
    : `<p class="empty">No guides on this topic yet. <a href="/blog">See all guides</a>.</p>`}
</main>
${siteFooter()}`,
  );
}

export function renderAuthor(slug, posts, { analytics = '' } = {}) {
  const author = AUTHORS[slug];
  const path = authorPath(slug);
  const theirs = posts.filter((post) => post.author === slug);
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Blog', path: '/blog' }, { name: author.name, path }];
  const description = `${author.name} is a certified interventionist with 20+ years of experience helping families through addiction, and the founder of FamilyBridge.`;
  const schema = [
    {
      '@type': 'ProfilePage',
      '@id': `${absolute(path)}#page`,
      url: absolute(path),
      name: `${author.name}, certified interventionist`,
      mainEntity: { '@id': `${SITE_URL}${path}#person` },
      inLanguage: 'en-US',
    },
    personSchema(author),
    ORGANIZATION,
    breadcrumbSchema(crumbs),
  ];
  return htmlDocument(
    head({ title: withBrand(`${author.name}, Certified Interventionist`), description, path, type: 'profile', schema, analytics }),
    `${siteHeader('blog')}
<main id="main" class="wrap">
${breadcrumbs(crumbs)}
<section class="profile">
<h1>${escapeHtml(author.name)}</h1>
<p class="dek">${escapeHtml(author.jobTitle)}</p>
${author.bio.map((p) => `<p>${escapeHtml(p)}</p>`).join('\n')}
<p>Matt is part of <a href="${author.worksFor.url}" rel="noopener" target="_blank">${escapeHtml(author.worksFor.name)}</a>.</p>
<h2>How these guides are written</h2>
<p>Every guide is written for families, in plain words, from what Matt has seen work with real families over two decades. They describe general practices that are widely accepted in the field, like CRAFT (Community Reinforcement and Family Training), and they don’t make up statistics, studies or stories. They’re general information, not medical, legal or mental health advice, and each one includes where to get emergency help.</p>
</section>
${theirs.length ? `<section class="list-head" aria-labelledby="by-author"><h2 id="by-author">Guides by ${escapeHtml(author.name)}</h2><ul class="cards">${theirs.map(card).join('')}</ul></section>` : ''}
</main>
${siteFooter()}`,
  );
}

export function renderRss(posts) {
  const items = posts.slice(0, 50).map((post) => `<item>
<title>${escapeHtml(post.seoTitle)}</title>
<link>${post.url}</link>
<guid isPermaLink="true">${post.url}</guid>
<pubDate>${rfc822(post.date)}</pubDate>
<dc:creator>${escapeHtml(AUTHORS[post.author].name)}</dc:creator>
<category>${escapeHtml(TOPICS[post.topic].name)}</category>
<description>${escapeHtml(post.description)}</description>
</item>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
<channel>
<title>The FamilyBridge Blog</title>
<link>${SITE_URL}/blog</link>
<description>${escapeHtml(BLOG_DESCRIPTION)}</description>
<language>en-us</language>
${posts.length ? `<lastBuildDate>${rfc822(posts.reduce((latest, post) => (post.updated > latest ? post.updated : latest), posts[0].updated))}</lastBuildDate>\n` : ''}<atom:link href="${SITE_URL}/blog/rss.xml" rel="self" type="application/rss+xml"/>
${items}
</channel>
</rss>
`;
}

/** A page that moved: an instant redirect that search engines treat as permanent, for hosts without server redirects. */
export function renderMoved(to) {
  const canonical = absolute(to.split('#')[0] || '/');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>This page has moved | FamilyBridge</title>
<meta name="robots" content="noindex, follow">
<link rel="canonical" href="${canonical}">
<meta http-equiv="refresh" content="0; url=${escapeHtml(to)}">
<script>location.replace(${JSON.stringify(to)})</script>
</head>
<body><p>This page has moved to <a href="${escapeHtml(to)}">${escapeHtml(canonical)}</a>.</p></body>
</html>
`;
}

/** Every blog page by path ("/blog", "/blog/x", "/blog/topic/x", "/blog/author/x", "/blog/rss.xml"), or null. */
export function renderBlogRoute(pathname, posts, options = {}) {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/blog') return { type: 'text/html; charset=utf-8', body: renderBlogIndex(posts, options) };
  if (path === '/blog/rss.xml') return { type: 'application/rss+xml; charset=utf-8', body: renderRss(posts) };
  const topic = path.match(/^\/blog\/topic\/([a-z0-9-]+)$/);
  if (topic && TOPICS[topic[1]]) return { type: 'text/html; charset=utf-8', body: renderTopic(topic[1], posts, options) };
  const author = path.match(/^\/blog\/author\/([a-z0-9-]+)$/);
  if (author && AUTHORS[author[1]]) return { type: 'text/html; charset=utf-8', body: renderAuthor(author[1], posts, options) };
  const post = posts.find((p) => p.path === path);
  if (post) return { type: 'text/html; charset=utf-8', body: renderPost(post, posts, options) };
  return null;
}

/** Every blog URL for the sitemap. Topic pages are listed once they have enough articles to be useful. */
export function blogSitemapEntries(posts) {
  if (!posts.length) return [];
  const latest = posts.reduce((max, post) => (post.updated > max ? post.updated : max), posts[0].updated);
  const counts = topicPostCounts(posts);
  return [
    { path: '/blog', lastmod: latest, changefreq: 'daily', priority: '0.8' },
    ...posts.map((post) => ({ path: post.path, lastmod: post.updated, changefreq: 'monthly', priority: '0.7' })),
    ...Object.keys(TOPICS).filter((key) => counts[key] >= MIN_TOPIC_POSTS).map((key) => ({
      path: topicPath(key), lastmod: posts.filter((post) => post.topic === key).reduce((max, post) => (post.updated > max ? post.updated : max), '0'), changefreq: 'weekly', priority: '0.6',
    })),
    { path: authorPath('matt-brown'), lastmod: latest, changefreq: 'monthly', priority: '0.5' },
  ];
}

/** Every static file the blog adds to the build, keyed by path. */
export function blogFiles(posts, options = {}) {
  const files = new Map();
  const add = (path) => {
    const page = renderBlogRoute(path, posts, options);
    if (page) files.set(path, page);
  };
  add('/blog');
  add('/blog/rss.xml');
  posts.forEach((post) => add(post.path));
  Object.keys(TOPICS).forEach((key) => add(topicPath(key)));
  Object.keys(AUTHORS).forEach((slug) => add(authorPath(slug)));
  return files;
}
