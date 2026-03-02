import { z } from 'genkit';

/**
 * @fileOverview This file contains shared Zod schemas for AI flows.
 * It does not have a 'use server' directive and can be safely imported
 * into both server and client components.
 */

export const CompetitorArticleSchema = z.object({
  title: z.string(),
  link: z.string().url(),
  pubDate: z.string(),
  source: z.string(),
  competitor: z.string(),
  isNew: z.boolean().describe('Whether the article was published in the last 24 hours.'),
});
export type CompetitorArticle = z.infer<typeof CompetitorArticleSchema>;

export const CompetitorWatchOutputSchema = z.array(CompetitorArticleSchema);
export type CompetitorWatchOutput = z.infer<typeof CompetitorWatchOutputSchema>;
