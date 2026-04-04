# 0xDiyor — Cybersecurity Portfolio

Personal portfolio and blog hosted on GitHub Pages.

## Structure

```
├── index.html          # The entire site (single file, no build step)
├── posts/              # Blog posts as Markdown files
│   ├── hello-world.md
│   └── homelab-proxmox-setup.md
├── assets/             # Images, resume PDF, etc.
└── README.md
```

## Adding a Blog Post

1. Write a `.md` file in the `posts/` directory
2. Add an entry to the `POSTS` array in `index.html`:

```javascript
{
  slug: "your-post-slug",           // URL-friendly name
  title: "Your Post Title",         // Display title
  date: "2026-04-03",               // YYYY-MM-DD
  tags: ["tag1", "tag2"],           // Category tags
  description: "Brief summary.",    // Shows in post list
  file: "posts/your-post-slug.md"  // Path to markdown file
}
```

3. Commit and push — GitHub Pages handles the rest.

## Adding a Project

Add an entry to the `PROJECTS` array in `index.html`.

## Local Development

Just open `index.html` in a browser. For markdown loading to work locally, use a local server:

```bash
python3 -m http.server 8000
# or
npx serve .
```

## Deployment

1. Push to a GitHub repo
2. Go to Settings → Pages → Source: Deploy from branch (main, root)
3. Your site will be live at `https://0xDiyor.github.io/repo-name`

For a custom domain, add a `CNAME` file with your domain.

## Stack

- Plain HTML/CSS/JS — no frameworks, no build tools
- [marked.js](https://github.com/markedjs/marked) for Markdown rendering (loaded via CDN)
- JetBrains Mono + Space Mono fonts
- GitHub Pages for hosting
