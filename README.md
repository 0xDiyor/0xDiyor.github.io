# 0xDiyor — Cybersecurity Portfolio

Personal portfolio and blog, built with [Astro](https://astro.build) and hosted on GitHub Pages at [0xdiyor.com](https://0xdiyor.com).

## Structure

```
├── astro.config.mjs        # Astro config (site URL, integrations)
├── src/
│   ├── content/blog/       # Blog posts — one .md file per post (frontmatter = metadata)
│   ├── content.config.ts   # Frontmatter schema — validates posts at build time
│   ├── data/projects.ts    # Projects list (rendered on /projects and home)
│   ├── data/bounties.ts    # CVE/bug bounty entries (rendered on /cves and home)
│   ├── assets/images/      # Post images — auto-optimized to WebP at build
│   ├── components/         # Reusable UI pieces (post item, project card, date)
│   ├── layouts/Base.astro  # Shared page shell (head, nav, footer)
│   ├── styles/global.css   # Site-wide styles
│   └── pages/              # Each file = a real URL (/, /blog, /blog/[slug], /projects, /about, /rss.xml)
├── public/                 # Served as-is (CNAME, favicon)
├── legacy/index.html       # The old single-file site, kept for design reference
└── .github/workflows/      # Builds and deploys on every push to main
```

## Development

Requires Node.js (installed via [nvm](https://github.com/nvm-sh/nvm)).

```sh
npm install      # once, after cloning
npm run dev      # local dev server at http://localhost:4321 with live reload
npm run build    # production build into dist/
npm run preview  # serve the production build locally
```

## Writing a post

Create `src/content/blog/my-post-slug.md` with frontmatter:

```markdown
---
title: "Post Title"
date: 2026-05-01
tags: ["homelab", "security"]
description: "One sentence shown in the post list and RSS feed."
---

## First Section

Content starts here...
```

Push to `main` — GitHub Actions builds and deploys automatically (~2 min).
The filename becomes the URL: `0xdiyor.com/blog/my-post-slug/`.

## Adding a CVE or bounty

Edit `src/data/bounties.ts` and add one entry per finding. `cve` is optional:
many bounties never receive a CVE ID, and the card falls back to the first
vulnerability class instead. Keep `bounty` as `null` if you do not want to
publish the amount.

```ts
{
  cve: 'CVE-2026-0000',
  program: 'Example Program',
  programUrl: 'https://hackerone.com/example',
  title: 'Stored XSS in the support portal message composer',
  severity: 'High', // Critical | High | Medium | Low
  type: ['Stored XSS'],
  date: '2026-05-01',
  bounty: 2500,
  links: [
    { label: 'NVD', url: 'https://nvd.nist.gov/vuln/detail/CVE-2026-0000' },
    { label: 'writeup', url: '/blog/my-writeup/' }, // internal links need no domain
  ],
}
```

Entries render on `/cves/` and the home page after the next deploy.
Full technical writeups belong in `src/content/blog/`; link them from the
bounty entry's `links` array.

## Deployment

GitHub Actions (`.github/workflows/deploy.yml`) builds the site and deploys to
GitHub Pages on every push to `main`. Repo Settings → Pages → Source must be
set to **GitHub Actions**.
