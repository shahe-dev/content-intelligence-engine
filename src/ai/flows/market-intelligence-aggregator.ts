'use server';

/**
 * @fileOverview Market Intelligence Aggregator Flow.
 *
 * This flow scrapes and aggregates real estate news from specified RSS feeds.
 * It identifies trending topics and demand signals from various sources,
 * and then uses an AI model to categorize each article.
 *
 * - aggregateMarketIntelligence - A function that handles the aggregation process.
 * - MarketIntelligenceOutput - The return type for the aggregateMarketIntelligence function.
 */

import {ai} from '@/ai/init';
import {z} from 'zod';
import Parser from 'rss-parser';
import {formatDistanceToNow, isAfter, subHours} from 'date-fns';
import {unstable_cache as cache} from 'next/cache';
import { type RssFeed } from '@/lib/store';

const CategorizationInputSchema = z.object({
  title: z.string(),
  snippet: z.string().optional(),
});

const CategorizationOutputSchema = z.object({
  mainTopic: z
    .string()
    .describe(
      'A high-level category for the article. Examples: Market Trends, Project Launch, Regulatory News, Economic Update, Company News.'
    ),
  subTopic: z
    .string()
    .describe(
      'A more specific topic within the main category. Examples: Off-plan Properties, Luxury Real Estate, Golden Visa, Interest Rates, Emaar Properties.'
    ),
});

const categorizationPrompt = ai.definePrompt({
  name: 'categorizeArticlePrompt',
  input: {schema: CategorizationInputSchema},
  output: {schema: CategorizationOutputSchema},
  prompt: `Analyze the following real estate news article title and snippet to determine its main topic and subtopic.

Title: {{{title}}}
Snippet: {{{snippet}}}

Clean the title of any HTML tags or encoded characters before using it.
Provide a concise main topic and subtopic.`,
});

const MarketIntelligenceItemSchema = z.object({
  source: z.string().describe('The source of the news item.'),
  title: z.string().describe('The title of the news item.'),
  link: z.string().url().describe('The URL to the full news item.'),
  pubDate: z.string().describe('The publication date of the news item.'),
  relativeDate: z.string().describe('The relative publication date.'),
  mainTopic: z.string().describe('The main topic of the article.'),
  subTopic: z.string().describe('The subtopic of the article.'),
});

const MarketIntelligenceOutputSchema = z.array(MarketIntelligenceItemSchema);

export type MarketIntelligenceOutput = z.infer<
  typeof MarketIntelligenceOutputSchema
>;

// This function needs to be defined outside the flow to be used by it
async function fetchAndProcessFeeds(feeds: RssFeed[]) {
    const parser = new Parser();
    let allItems: any[] = [];

    for (const feed of feeds) {
      try {
        const parsedFeed = await parser.parseURL(feed.url);
        if (parsedFeed.items) {
          const items = parsedFeed.items.map((item: any) => {
            const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
            const snippet = item.contentSnippet || '';
            return {
              source: feed.source,
              title: item.title || 'No title',
              link: item.link || '',
              pubDate: pubDate.toISOString(),
              relativeDate: formatRelativeDate(pubDate),
              snippet: snippet,
              mainTopic: 'Uncategorized',
              subTopic: 'N/A',
            };
          });
          allItems = allItems.concat(items);
        }
      } catch (error) {
        console.error(
          `Failed to fetch or parse feed from ${feed.source}:`,
          error
        );
      }
    }

    // Sort all items by date, newest first
    allItems.sort(
      (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
    );
    
    // Only categorize articles from the last 48 hours, and limit to the most recent 20 to avoid timeouts/rate limits
    const fortyEightHoursAgo = subHours(new Date(), 48);
    const recentItemsToCategorize = allItems.filter(item => isAfter(new Date(item.pubDate), fortyEightHoursAgo)).slice(0, 20);


    // Categorize the subset
    for (const item of recentItemsToCategorize) {
      try {
        const {output} = await categorizationPrompt({
          title: item.title,
          snippet: item.snippet,
        });
        if (output) {
          // Find the item in the original allItems array and update it
          const originalItem = allItems.find(i => i.link === item.link);
          if (originalItem) {
            originalItem.mainTopic = output.mainTopic;
            originalItem.subTopic = output.subTopic;
          }
        }
      } catch (error) {
        console.error(`Failed to categorize article: "${item.title}"`, error);
        // The item will remain "Uncategorized" if an error occurs.
      }
    }
    return allItems;
}


const aggregateMarketIntelligenceFlow = ai.defineFlow(
  {
    name: 'aggregateMarketIntelligenceFlow',
    inputSchema: z.array(z.any()), // Expecting RSS feeds array
    outputSchema: MarketIntelligenceOutputSchema,
  },
  async (feeds) => {
    return await fetchAndProcessFeeds(feeds);
  }
);


export async function aggregateMarketIntelligence(feeds: RssFeed[]): Promise<MarketIntelligenceOutput> {
  return getCachedMarketIntelligence(feeds);
}

const getCachedMarketIntelligence = cache(
  async (feeds: RssFeed[]) => {
    // The flow now takes the feeds as an argument.
    return await aggregateMarketIntelligenceFlow(feeds);
  },
  ['market-intelligence'],
  {
    revalidate: 3600,
  }
);


function formatRelativeDate(date: Date): string {
  const formatted = formatDistanceToNow(date, {addSuffix: true});
  return formatted
    .replace('about ', '')
    .replace(' minutes', 'm ago')
    .replace(' minute', 'm ago')
    .replace(' hours', 'h ago')
    .replace(' hour', 'h ago');
}
