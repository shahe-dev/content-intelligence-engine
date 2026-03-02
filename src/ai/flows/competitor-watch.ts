'use server';

/**
 * @fileOverview Competitor Watch Flow.
 *
 * This flow identifies articles mentioning or published by a predefined list of competitors
 * by leveraging the central Market Intelligence Aggregator.
 *
 * - competitorWatch - A function that returns a list of competitor articles.
 * - CompetitorArticle - The type for a single competitor article.
 * - CompetitorWatchOutput - The return type for the competitorWatch function.
 */

import { ai } from '@/ai/init';
import { z } from 'genkit';
import { isAfter, subHours, subDays } from 'date-fns';
import { CompetitorArticleSchema, type CompetitorWatchOutput } from './schemas';
import type { MarketIntelligenceOutput } from './market-intelligence-aggregator';
import { type Competitor } from '@/lib/store';

export async function competitorWatch(allArticles: MarketIntelligenceOutput, competitorList: Competitor[]): Promise<CompetitorWatchOutput> {
  // Pass the list of competitors to the flow.
  return competitorWatchFlow({ allArticles, competitorList });
}

const CompetitorWatchInputSchema = z.object({
    allArticles: z.any(),
    competitorList: z.array(z.object({
        name: z.string(),
        domain: z.string(),
    })),
});

const competitorWatchFlow = ai.defineFlow(
  {
    name: 'competitorWatchFlow',
    inputSchema: CompetitorWatchInputSchema,
    outputSchema: z.array(CompetitorArticleSchema),
  },
  async ({ allArticles, competitorList }) => {
    let competitorArticles: CompetitorWatchOutput = [];
    const thirtyDaysAgo = subDays(new Date(), 30);
    const twentyFourHoursAgo = subHours(new Date(), 24);

    for (const item of allArticles) {
      const pubDate = new Date(item.pubDate);
      
      // Filter for articles in the last 30 days
      if (isAfter(pubDate, thirtyDaysAgo)) {
        for (const competitor of competitorList) {
          const isFromCompetitorDomain = item.link.includes(competitor.domain);
          const isMentioned = item.title.toLowerCase().includes(competitor.name.toLowerCase());

          if (isFromCompetitorDomain || isMentioned) {
            competitorArticles.push({
              title: item.title,
              link: item.link,
              pubDate: item.pubDate,
              source: isFromCompetitorDomain ? competitor.name : item.source,
              competitor: competitor.name,
              isNew: isAfter(pubDate, twentyFourHoursAgo),
            });
            // Break after finding the first competitor match for an item
            break; 
          }
        }
      }
    }

    // Remove duplicates by link
    const uniqueArticles = Array.from(new Map(competitorArticles.map(item => [item.link, item])).values());

    // Sort by date, newest first
    uniqueArticles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    return uniqueArticles;
  }
);
