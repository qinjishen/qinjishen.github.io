# Qin Ji Shen Blog

A bilingual Astro blog designed for Markdown writing and automatic deployment to GitHub Pages.

## Local preview

```bash
npm install
npm run dev
```

Open the local address printed by Astro, normally `http://localhost:4321`.

## Publish

Push the `main` branch to GitHub. The workflow in `.github/workflows/deploy.yml` builds the site and publishes it to GitHub Pages automatically.

In the repository settings, open **Settings > Pages** and set **Source** to **GitHub Actions** if GitHub does not select it automatically.

## Add an article

Create a Markdown file under one of these directories:

```text
src/content/posts/zh/
src/content/posts/en/
```

Use the existing `hello-world.md` file as the frontmatter template. Keep `draft: true` until an article is ready to publish.

## Obsidian sync

Copy `.env.example` to `.env.local`, set the absolute paths for your vault, then run:

```bash
npm run sync:obsidian
```

For continuous local syncing while writing:

```bash
npm run sync:obsidian:watch
```
