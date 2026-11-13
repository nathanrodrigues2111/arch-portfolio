import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '*/index.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      location: z.string(),
      year: z.number(),
      type: z.string(),
      area: z.string().optional(),
      status: z.string().optional(),
      order: z.number().default(99),
      images: z.array(image()).min(1),
    }),
});

export const collections = { projects };
