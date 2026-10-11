// The FamilyBridge blog: one Markdown file per article in src/content/blog/ (see the README there).
// Used by the build (scripts/generate-static-route-metadata.mjs) and by the dev server (scripts/blog/vite-plugin.mjs),
// so the pages people and search engines get are the same plain HTML everywhere.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const SITE_URL = 'https://familybridgeapp.com';
export const APP_STORE_URL = 'https://apps.apple.com/app/id6757375159';
export const BLOG_DIR_FROM_ROOT = 'src/content/blog';

export const AUTHORS = {
  'matt-brown': {
    slug: 'matt-brown',
    name: 'Matt Brown',
    jobTitle: 'Certified interventionist and founder of FamilyBridge',
    short: 'Matt Brown is a certified interventionist with more than 20 years of experience helping families through addiction, a person in long-term recovery, and the founder of FamilyBridge.',
    bio: [
      'Matt Brown is a certified interventionist who has spent more than 20 years helping families whose loved one is struggling with alcohol or drugs. He works with parents, spouses, siblings and grandparents before, during and after treatment, and with the interventionists, treatment centers and therapists who serve them.',
      'Matt is also a person in long-term recovery, so he knows this road from both sides. He founded FamilyBridge to help families do what he has seen work best: stop pulling in different directions, agree on one plan, and face addiction together.',
    ],
    worksFor: { name: 'Freedom Interventions', url: 'https://freedominterventions.com' },
    knowsAbout: ['Addiction intervention', 'Family recovery', 'CRAFT (Community Reinforcement and Family Training)', 'Boundaries with an addicted loved one', 'Relapse prevention', 'Addiction treatment'],
  },
};

// Every article belongs to one topic. A topic page is indexed once it has at least MIN_TOPIC_POSTS articles.
export const MIN_TOPIC_POSTS = 3;
export const TOPICS = {
  'getting-on-the-same-page': {
    name: 'Getting on the same page',
    title: 'Getting Your Family on the Same Page About Addiction',
    intro: 'When parents, partners and relatives disagree about how to help, a loved one gets mixed messages and the family pays the price. These guides help families stop working against each other and answer with one calm voice.',
  },
  communication: {
    name: 'Communication',
    title: 'Talking With a Loved One About Addiction',
    intro: 'What to say, what not to say, and how to keep hard conversations from turning into fights, at the dinner table, in the family chat and in family meetings.',
  },
  money: {
    name: 'Money and requests',
    title: 'Money, Requests and Addiction: Helping Without Rescuing',
    intro: 'Requests for rent, phone bills, rides and "just this once" are where good family plans fall apart. These guides help you decide together and say no to cash without saying no to your loved one.',
  },
  boundaries: {
    name: 'Boundaries and agreements',
    title: 'Setting Boundaries With an Addicted Loved One as a Family',
    intro: 'Boundaries work when the whole family agrees on them ahead of time and holds them the same way. Here is how to set them, keep them, and keep love in the message.',
  },
  'before-treatment': {
    name: 'Before treatment',
    title: 'When a Loved One Won’t Get Help: Guides for Families',
    intro: 'Families have more influence than they think. Learn how CRAFT works, how to notice a window of opportunity, and how to invite a loved one into treatment with love instead of confrontation.',
  },
  'treatment-and-recovery': {
    name: 'Treatment and early recovery',
    title: 'Treatment and Early Recovery: What Families Can Do',
    intro: 'What your family can do while a loved one is in treatment, how to prepare for coming home, and how trust is rebuilt step by step in early recovery.',
  },
  relapse: {
    name: 'Relapse',
    title: 'Relapse and the Family: Planning Calmly in Advance',
    intro: 'Warning signs, a calm family plan, what to say and what to avoid, and how to keep everyone safe if a loved one starts using again.',
  },
  'family-wellbeing': {
    name: 'Caring for your family',
    title: 'Caring for Yourself and Your Family Through Addiction',
    intro: 'Parents, spouses, siblings and grandparents carry addiction too. These guides cover burnout, guilt, grief and the support that helps the whole family heal.',
  },
  'working-with-professionals': {
    name: 'Working with professionals',
    title: 'Working With Interventionists and Treatment Teams as a Family',
    intro: 'How families can work with interventionists, treatment centers, therapists and family programs, including how information is shared with consent and how to stay involved through each step of care.',
  },
};
const DEFAULT_TOPIC = 'getting-on-the-same-page';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RESERVED_SLUGS = new Set(['topic', 'author', 'rss', 'page', 'index', 'feed']);

export const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

export const slugify = (text) => String(text)
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[̀-ͯ]/g, '')
  .replace(/[’'"“”]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 80);

/** "key: value" lines between --- fences. Values may contain colons; surrounding quotes are optional. */
export function parseFrontMatter(source) {
  const match = source.replace(/^﻿/, '').match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: source };
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const at = line.indexOf(':');
    if (at < 1 || /^\s*#/.test(line)) continue;
    let value = line.slice(at + 1).trim();
    if (value.length >= 2 && value[0] === value.at(-1) && `"'`.includes(value[0])) value = value.slice(1, -1);
    data[line.slice(0, at).trim()] = value;
  }
  return { data, body: match[2] };
}

const isIsoDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value ?? '') && !Number.isNaN(Date.parse(value));

export const longDate = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

/** Inline Markdown: **bold**, *italic*, [text](url). Links to articles that aren't published yet become plain text. */
function renderInline(text, ctx) {
  let html = escapeHtml(text);
  html = html.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, rawUrl) => {
    let url = rawUrl.replaceAll('&amp;', '&');
    if (url.startsWith(SITE_URL)) url = url.slice(SITE_URL.length) || '/';
    if (url.startsWith('/blog/') && !url.startsWith('/blog/topic/') && !url.startsWith('/blog/author/')) {
      const slug = url.slice('/blog/'.length).split(/[?#]/)[0].replace(/\/$/, '');
      if (!ctx.slugs.has(slug)) {
        ctx.warnings.push(`links to /blog/${slug}, which isn't published yet (shown as plain text)`);
        return label;
      }
      ctx.internalLinks.add(slug);
    }
    const external = /^https?:\/\//.test(url);
    return `<a href="${escapeHtml(url)}"${external ? ' rel="noopener" target="_blank"' : ''}>${label}</a>`;
  });
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(^|[^*\w])\*(?!\s)(.+?)(?<!\s)\*(?![*\w])/g, '$1<em>$2</em>');
  return html;
}

const stripTags = (html) => html.replace(/<[^>]+>/g, '').replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&quot;', '"').replace(/\s+/g, ' ').trim();

/**
 * Block Markdown: ## and ### headings, paragraphs, "- " and "1. " lists, "> " quotes.
 * Returns the article HTML plus its headings (for the table of contents) and the FAQ (for FAQPage structured data).
 */
export function renderMarkdown(markdown, ctx) {
  const out = [];
  const headings = [];
  const faq = [];
  const ids = new Set();
  let paragraph = [];
  let list = null; // { tag, items }
  let quote = [];
  let inFaq = false;
  let currentQuestion = null;

  const emit = (html) => {
    out.push(html);
    if (inFaq && currentQuestion) currentQuestion.answer.push(html);
  };
  const flush = () => {
    if (paragraph.length) emit(`<p>${renderInline(paragraph.join(' '), ctx)}</p>`);
    if (list) emit(`<${list.tag}>${list.items.map((item) => `<li>${renderInline(item, ctx)}</li>`).join('')}</${list.tag}>`);
    if (quote.length) emit(`<blockquote><p>${renderInline(quote.join(' '), ctx)}</p></blockquote>`);
    paragraph = [];
    list = null;
    quote = [];
  };
  const uniqueId = (text) => {
    const base = slugify(text) || 'section';
    let id = base;
    for (let n = 2; ids.has(id); n += 1) id = `${base}-${n}`;
    ids.add(id);
    return id;
  };

  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    const bullet = line.match(/^\s*[-*•]\s+(.+)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    const quoted = line.match(/^>\s?(.*)$/);

    if (!line.trim()) { flush(); continue; }
    if (heading) {
      flush();
      // The page prints the title as the only <h1>, so a "# " heading in the body becomes a section heading.
      const level = Math.max(2, Math.min(3, heading[1].length));
      const text = heading[2].trim();
      const id = uniqueId(text);
      if (level === 2) {
        inFaq = /^(frequently asked questions|faqs?\b)/i.test(text);
        currentQuestion = null;
        headings.push({ id, text: stripTags(renderInline(text, { ...ctx, warnings: [] })) });
        out.push(`<h2 id="${id}">${renderInline(text, ctx)}</h2>`);
      } else {
        out.push(`<h3 id="${id}">${renderInline(text, ctx)}</h3>`);
        if (inFaq) {
          currentQuestion = { question: stripTags(renderInline(text, { ...ctx, warnings: [] })), answer: [] };
          faq.push(currentQuestion);
        }
      }
      continue;
    }
    if (bullet || numbered) {
      const tag = bullet ? 'ul' : 'ol';
      if (paragraph.length || quote.length || (list && list.tag !== tag)) flush();
      list ??= { tag, items: [] };
      list.items.push((bullet ?? numbered)[1].trim());
      continue;
    }
    if (quoted) {
      if (paragraph.length || list) flush();
      quote.push(quoted[1].trim());
      continue;
    }
    if (list || quote.length) flush();
    paragraph.push(line.trim());
  }
  flush();

  const html = out.join('\n');
  return {
    html,
    headings,
    faq: faq.filter((item) => item.answer.length).map((item) => ({ question: item.question, answer: stripTags(item.answer.join(' ')) })),
    words: stripTags(html).split(' ').filter(Boolean).length,
  };
}

/** Read every article in src/content/blog. Problems are reported as warnings; a bad file never breaks the site build. */
export function loadPosts(projectRoot, { log = console } = {}) {
  const dir = join(projectRoot, BLOG_DIR_FROM_ROOT);
  let files = [];
  try {
    files = readdirSync(dir).filter((file) => file.endsWith('.md') && file.toLowerCase() !== 'readme.md' && !file.startsWith('_'));
  } catch {
    return [];
  }

  const drafts = files.map((file) => {
    const source = readFileSync(join(dir, file), 'utf8');
    const { data, body } = parseFrontMatter(source);
    // A file named "2026-10-12-my-post.md" (or "2026-10-12-03-my-post.md") is published at /blog/my-post.
    const fromName = file.replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-(?:\d{1,2}-)?/, '');
    const slug = SLUG_RE.test(data.slug ?? '') ? data.slug : slugify(fromName);
    return { file, data, body, slug };
  }).filter((post) => {
    if (/^(true|yes)$/i.test(post.data.draft ?? '')) return false;
    if (!post.slug || !SLUG_RE.test(post.slug)) {
      log.warn(`[blog] ${post.file}: skipped — can't make a web address from the file name`);
      return false;
    }
    if (RESERVED_SLUGS.has(post.slug)) {
      log.warn(`[blog] ${post.file}: skipped — /blog/${post.slug} is used by the blog itself; pick another slug`);
      return false;
    }
    return true;
  });

  const seen = new Set();
  const unique = drafts.filter((post) => {
    if (seen.has(post.slug)) {
      log.warn(`[blog] ${post.file}: skipped — another article already uses /blog/${post.slug}`);
      return false;
    }
    seen.add(post.slug);
    return true;
  });
  const slugs = new Set(unique.map((post) => post.slug));

  const posts = unique.map(({ file, data, body, slug }) => {
    const warnings = [];
    let markdown = body;
    let title = data.title;
    if (!title) {
      const h1 = markdown.match(/^#\s+(.+)$/m);
      title = h1 ? h1[1].trim() : fromSlug(slug);
      if (h1) markdown = markdown.replace(h1[0], '');
      warnings.push('no title in the header; using the first heading');
    } else {
      // The page prints the title; drop a repeated "# title" at the top of the body.
      markdown = markdown.replace(/^\s*#\s+(.+)\r?\n/, (whole, text) => (text.trim() === title.trim() ? '' : whole));
    }
    const ctx = { slugs, warnings, internalLinks: new Set() };
    const rendered = renderMarkdown(markdown, ctx);
    const description = (data.description || stripTags(rendered.html.split('</p>')[0] ?? '')).slice(0, 165);
    if (!data.description) warnings.push('no description in the header; using the first paragraph');
    const date = isIsoDate(data.date) ? data.date : new Date().toISOString().slice(0, 10);
    if (!isIsoDate(data.date)) warnings.push(`date "${data.date ?? ''}" isn't YYYY-MM-DD; using today`);
    const updated = isIsoDate(data.updated) && data.updated > date ? data.updated : date;
    const topic = TOPICS[data.topic] ? data.topic : DEFAULT_TOPIC;
    if (!TOPICS[data.topic]) warnings.push(`topic "${data.topic ?? ''}" isn't one of: ${Object.keys(TOPICS).join(', ')}`);
    const author = AUTHORS[data.author] ? data.author : 'matt-brown';
    for (const warning of warnings) log.warn(`[blog] ${file}: ${warning}`);
    return {
      file,
      slug,
      path: `/blog/${slug}`,
      url: `${SITE_URL}/blog/${slug}`,
      title,
      seoTitle: data.seoTitle || title,
      description,
      keyword: data.keyword || '',
      topic,
      author,
      date,
      updated,
      image: data.image || '',
      imageAlt: data.imageAlt || '',
      html: rendered.html,
      headings: rendered.headings,
      faq: rendered.faq,
      words: rendered.words,
      minutes: Math.max(1, Math.round(rendered.words / 230)),
      links: [...ctx.internalLinks],
    };
  });

  return posts.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
}

const fromSlug = (slug) => slug.split('-').map((word, i) => (i === 0 ? word[0].toUpperCase() + word.slice(1) : word)).join(' ');

/** Same-topic articles first, then articles linked to or from this one, then the newest others. */
export function relatedPosts(post, posts, count = 3) {
  const score = (other) => (other.topic === post.topic ? 2 : 0)
    + (post.links.includes(other.slug) || other.links.includes(post.slug) ? 1 : 0);
  return posts
    .filter((other) => other.slug !== post.slug)
    .map((other, index) => ({ other, index, score: score(other) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, count)
    .map(({ other }) => other);
}

export const topicPostCounts = (posts) => Object.fromEntries(Object.keys(TOPICS).map((key) => [key, posts.filter((post) => post.topic === key).length]));

/** The fields the React site needs (homepage "Guides for families", nav link). */
export const postSummaries = (posts) => posts.map(({ slug, path, title, seoTitle, description, topic, date, minutes }) => ({
  slug, path, title, seoTitle, description, topic, topicName: TOPICS[topic].name, date, minutes,
}));
