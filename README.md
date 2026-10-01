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
│   ├── data/github.ts      # Build-time GitHub data: pinned repos, contribution graph
│   ├── utils/posts.ts      # Sorted posts, read time, date formatting
│   ├── assets/images/      # Post images — auto-optimized to WebP at build
│   ├── components/         # AsciiName (animated name), Nav, Social, PostRecord,
│   │                       # ProjectRecord, ContributionGraph
│   ├── layouts/Base.astro  # Shared page shell (head/meta, header, footer)
│   ├── styles/global.css   # Site-wide styles (black and white, IBM Plex Mono)
│   └── pages/              # Each file = a real URL (/, /blog, /blog/[slug], /projects, /cves, /about, /rss.xml)
├── public/                 # Served as-is (CNAME, favicons, og.png link preview)
└── .github/                # Deploy workflow and Dependabot config
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
series: "Proxmox rebuild"   # optional: posts sharing a series link to each other
---

## First Section

Content starts here...
```

Push to `main` — GitHub Actions builds and deploys automatically (~1 min).
The filename becomes the URL: `0xdiyor.com/blog/my-post-slug/`. Read time is
calculated from the word count at build.

## Adding a project

Add an entry to `PROJECTS` in `src/data/projects.ts`. Besides the required
fields, `category` sets the heading it's grouped under on `/projects/`
(`Tools` and `Sites & coursework` are listed first; anything without one goes
under `Tools`), and `writeup` takes a blog post slug to link the project to its
post. Repos pinned on the GitHub profile but not listed here show up under
`Tools` automatically.

## Adding a CVE or bounty

Edit `src/data/bounties.ts` and add one entry per finding. `cve` is optional:
many bounties never receive a CVE ID, and the entry falls back to the first
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
GitHub Pages on every push to `main`, and rebuilds nightly so the GitHub data
stays fresh. Repo Settings → Pages → Source must be set to **GitHub Actions**.
Dependabot (`.github/dependabot.yml`) opens a PR monthly when one of the
workflow's actions has a new version.

Pinned repos and the contribution graph need a GitHub token, which the
workflow provides. Locally they're left out unless you pass one:

```sh
GITHUB_TOKEN=$(gh auth token) npm run dev
```
