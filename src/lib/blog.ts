import { getCollection, type CollectionEntry } from "astro:content";
import { sitePath } from "./paths";

export type Lang = "zh" | "en";
export type Post = CollectionEntry<"posts">;

type Dictionary = {
  label: string;
  path: string;
  siteTitle: string;
  homeTitle: string;
  homeDescription: string;
  navHome: string;
  navBlog: string;
  navAbout: string;
  latestPosts: string;
  allPosts: string;
  readArticle: string;
  publishDate: string;
  updatedDate: string;
  switchLabel: string;
};

export const languages: Record<Lang, Dictionary> = {
  zh: {
    label: "中文",
    path: "/zh/",
    siteTitle: "秦继深",
    homeTitle: "写作、笔记与长期项目",
    homeDescription: "记录阅读、技术实践与那些值得慢慢想清楚的问题。",
    navHome: "首页",
    navBlog: "文章",
    navAbout: "关于",
    latestPosts: "最新文章",
    allPosts: "全部文章",
    readArticle: "阅读全文",
    publishDate: "发布于",
    updatedDate: "更新于",
    switchLabel: "English"
  },
  en: {
    label: "English",
    path: "/en/",
    siteTitle: "Qin Ji Shen",
    homeTitle: "Writing, notes, and long-term work",
    homeDescription: "Notes on reading, technology, and questions worth thinking through slowly.",
    navHome: "Home",
    navBlog: "Blog",
    navAbout: "About",
    latestPosts: "Latest posts",
    allPosts: "All posts",
    readArticle: "Read article",
    publishDate: "Published",
    updatedDate: "Updated",
    switchLabel: "中文"
  }
};

export async function getPostsByLang(lang: Lang) {
  const posts = await getCollection("posts", ({ data }) => {
    return data.lang === lang && (!import.meta.env.PROD || !data.draft);
  });

  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export async function getPostTranslation(post: Post) {
  const posts = await getCollection("posts", ({ data }) => {
    return data.translationKey === post.data.translationKey
      && (!import.meta.env.PROD || !data.draft);
  });

  return posts.find((entry) => entry.data.lang !== post.data.lang);
}

export function toPostUrl(post: Post) {
  return sitePath(`/${post.data.lang}/blog/${post.data.permalink}/`);
}

export function formatDate(date: Date, lang: Lang) {
  return new Intl.DateTimeFormat(lang === "zh" ? "zh-CN" : "en-US", {
    dateStyle: "long"
  }).format(date);
}
