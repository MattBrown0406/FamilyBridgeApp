# FamilyBridge blog articles

Every `.md` file in this folder (except this README) is published at **familybridgeapp.com/blog/&lt;slug&gt;** the next
time the site is published. The build turns each one into a complete static page: title and description, table of
contents, author box, related articles, App Store call to action, and structured data for search engines (article,
author, breadcrumbs and the FAQ). It also adds the article to `/blog`, its topic page, the sitemap, the RSS feed
(`/blog/rss.xml`) and `llms.txt`, and the newest three appear on the homepage. Nothing else needs to change.

## How to post an article

1. Open https://github.com/MattBrown0406/FamilyBridgeApp/upload/main/src/content/blog
2. Drag in the article's `.md` file (from Desktop › Blog Articles › FamilyBridge › website) and click **Commit changes**.
3. In Lovable, click **Publish → Update**. The article is live a minute later.

To fix a typo later, edit the file the same way (or in Lovable) and publish again. To take an article down, delete its
file and publish. To hide one without deleting it, add `draft: true` to its header.

## File format

```markdown
---
title: Should I Give My Addicted Son Money? What to Say When He Asks for Rent
seoTitle: Should I Give My Addicted Son Money?
description: Should I give my addicted son money for rent, his phone or his car? Learn the difference between helping and rescuing, and what to say.
keyword: should I give my addicted son money
slug: should-i-give-my-addicted-son-money
topic: money
date: 2026-10-11
author: matt-brown
---
The opening paragraph…

## A question the reader would ask?

The answer…

### A smaller heading

- A bullet
- Another bullet

## Frequently Asked Questions About Giving an Addicted Son Money

### A question?

Its answer.
```

| Field | What it's for |
| --- | --- |
| `title` | The headline on the page (the only H1). |
| `seoTitle` | The shorter title Google shows, 60 characters or fewer. " \| FamilyBridge" is added when it fits. |
| `description` | The meta description under the title in Google, 145–160 characters. |
| `keyword` | The focus keyword. |
| `slug` | The web address: lowercase words joined by hyphens. Don't change it after posting, or old links break. |
| `topic` | One of `getting-on-the-same-page`, `communication`, `money`, `boundaries`, `before-treatment`, `treatment-and-recovery`, `relapse`, `family-wellbeing`, `working-with-professionals`. |
| `date` | The day the article goes on the site (YYYY-MM-DD). Add `updated: YYYY-MM-DD` when you revise it. |
| `author` | `matt-brown`. |

Article body: `##` and `###` headings, paragraphs, `- ` and `1. ` lists, `**bold**`, `*italic*` and
`[links](/blog/another-slug)`. Don't repeat the title as a `#` heading or add a byline or "About the author" — the page
adds those. A `## Frequently Asked Questions…` section with `###` questions becomes FAQ structured data automatically.
A link to an article that isn't posted yet shows as plain text until that article is up.

Optional: `image: /blog-images/file.jpg` (in `public/blog-images/`, at least 1200 px wide) and `imageAlt: …` give the
article its own picture when it's shared; otherwise the FamilyBridge share image is used.

The pages are built by `scripts/blog/` (see `content.mjs` and `render.mjs`).
