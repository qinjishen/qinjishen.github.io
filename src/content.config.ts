import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const posts = defineCollection({
  loader: glob({
    base: "./src/content/posts",
    pattern: "**/*.md"
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    lang: z.enum(["zh", "en"]),
    category: z.string().optional(),
    date: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    permalink: z.string(),
    tags: z.array(z.string()).default([]),
    translationKey: z.string(),
    heroImage: z.string().optional()
  })
});

export const collections = { posts };
