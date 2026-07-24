import fs from "node:fs/promises";
import path from "node:path";
import chokidar from "chokidar";
import matter from "gray-matter";

const projectRoot = process.cwd();
const vaultRoot = process.env.OBSIDIAN_VAULT_DIR;
const watch = process.argv.includes("--watch");

if (!vaultRoot) {
  console.error("Missing OBSIDIAN_VAULT_DIR in .env.local");
  process.exit(1);
}

const contentRoot = path.join(projectRoot, "src/content/posts");
const assetRoot = path.join(projectRoot, "public/obsidian-assets");
const postRoots = envPaths(process.env.OBSIDIAN_POSTS_DIRS, ["."]);
const assetRoots = envPaths(process.env.OBSIDIAN_ASSET_DIRS, []);
const markdownExtensions = new Set([".md", ".markdown"]);
const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".avif"]);
const ignoredDirectories = new Set([".obsidian", ".trash", "node_modules"]);

await syncAll();
console.log("Obsidian sync completed.");

if (watch) {
  console.log("Watching Obsidian files for changes...");
  const watcher = chokidar.watch([...postRoots, ...assetRoots], { ignoreInitial: true });
  watcher.on("add", syncPath);
  watcher.on("change", syncPath);
}

async function syncAll() {
  for (const root of assetRoots) {
    for (const file of await walk(root)) {
      if (isImage(file)) await copyAsset(file);
    }
  }

  for (const root of postRoots) {
    for (const file of await walk(root)) {
      if (isMarkdown(file)) await syncPost(file);
    }
  }
}

async function syncPath(file) {
  try {
    if (isMarkdown(file)) {
      await syncPost(file);
      console.log(`Synced: ${path.relative(vaultRoot, file)}`);
    } else if (isImage(file)) {
      await copyAsset(file);
      console.log(`Copied: ${path.relative(vaultRoot, file)}`);
    }
  } catch (error) {
    console.error(`Could not sync ${file}`, error);
  }
}

async function syncPost(file) {
  const raw = await fs.readFile(file, "utf8");
  const stat = await fs.stat(file);
  const parsed = matter(raw);
  const relative = toPosix(path.relative(vaultRoot, file));
  const stem = path.basename(file, path.extname(file));
  const permalink = text(parsed.data.permalink) || slugify(stem);
  const lang = parsed.data.lang === "en" || /(^|\/)en(glish)?\//i.test(relative) ? "en" : "zh";
  const category = text(parsed.data.category) || inferCategory(relative, lang);
  const destination = path.join(contentRoot, lang, sanitizePath(category), `${permalink}.md`);
  const body = await rewriteEmbeds(parsed.content, file);

  const frontmatter = {
    title: text(parsed.data.title) || stem.replace(/[-_]/g, " "),
    description: text(parsed.data.description) || descriptionFrom(body),
    lang,
    category,
    date: normalizeDate(parsed.data.date) || stat.mtime.toISOString().slice(0, 10),
    updatedDate: normalizeDate(parsed.data.updatedDate) || stat.mtime.toISOString().slice(0, 10),
    draft: typeof parsed.data.draft === "boolean" ? parsed.data.draft : /(^|\/)drafts?\//i.test(relative),
    permalink,
    tags: normalizeTags(parsed.data.tags),
    translationKey: text(parsed.data.translationKey) || permalink
  };

  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, matter.stringify(body, frontmatter), "utf8");
}

async function rewriteEmbeds(content, sourceFile) {
  const matches = [...content.matchAll(/!\[\[([^\]]+)\]\]/g)];
  let result = content;

  for (const match of matches) {
    const [targetPart, aliasPart] = match[1].split("|");
    const target = targetPart.trim();
    const source = await findAsset(target, sourceFile);
    const alt = aliasPart?.trim() || path.basename(target, path.extname(target));

    if (!source) {
      result = result.replace(match[0], `![${alt}]()`);
      continue;
    }

    await copyAsset(source);
    const publicPath = toPosix(path.relative(vaultRoot, source));
    result = result.replace(match[0], `![${alt}](../../../obsidian-assets/${publicPath})`);
  }

  return result.replace(/\[\[([^\]]+)\]\]/g, (_full, value) => {
    const [target, alias] = value.split("|");
    return (alias || target).trim();
  });
}

async function findAsset(target, sourceFile) {
  const candidates = [
    path.resolve(path.dirname(sourceFile), target),
    path.resolve(vaultRoot, target)
  ];

  for (const candidate of candidates) {
    if (await exists(candidate)) return candidate;
  }

  for (const root of assetRoots) {
    const found = (await walk(root)).find((file) => path.basename(file) === path.basename(target));
    if (found) return found;
  }

  return null;
}

async function copyAsset(source) {
  const destination = path.join(assetRoot, path.relative(vaultRoot, source));
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.copyFile(source, destination);
}

async function walk(root) {
  let entries;
  try {
    entries = await fs.readdir(root, { withFileTypes: true });
  } catch {
    return [];
  }

  const files = [];
  for (const entry of entries) {
    if (ignoredDirectories.has(entry.name)) continue;
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...await walk(fullPath));
    else files.push(fullPath);
  }
  return files;
}

function envPaths(value, fallback) {
  const paths = value ? value.split(",").map((item) => item.trim()).filter(Boolean) : fallback;
  return paths.map((item) => path.resolve(vaultRoot, item));
}

function inferCategory(relative, lang) {
  const segments = relative.split("/").slice(0, -1).filter((segment) => {
    return ![lang, "english", "chinese", "blog", "writing"].includes(segment.toLowerCase());
  });
  return segments.join("/") || "notes";
}

function normalizeTags(value) {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") return value.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
}

function normalizeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date.toISOString().slice(0, 10);
}

function descriptionFrom(content) {
  return content.split("\n").map((line) => line.trim()).find((line) => {
    return line && !line.startsWith("#") && !line.startsWith("-") && !line.startsWith("![");
  }) || "No description yet.";
}

function sanitizePath(value) {
  return value.split("/").map((segment) => slugify(segment) || "notes").join("/");
}

function slugify(value) {
  return value.normalize("NFKC").trim().replace(/[\/\\\s]+/g, "-")
    .replace(/[^\p{Letter}\p{Number}-]+/gu, "").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isMarkdown(file) {
  return markdownExtensions.has(path.extname(file).toLowerCase());
}

function isImage(file) {
  return imageExtensions.has(path.extname(file).toLowerCase());
}

function toPosix(value) {
  return value.split(path.sep).join("/");
}

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}
