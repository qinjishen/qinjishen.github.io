import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { sitePath } from "../lib/paths";

export async function GET(context) {
  const posts = await getCollection("posts", ({ data }) => !data.draft);

  return rss({
    title: "Qin Ji Shen",
    description: "Bilingual writing on reading, technology, and long-term work.",
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: sitePath(`/${post.data.lang}/blog/${post.data.permalink}/`)
    }))
  });
}
