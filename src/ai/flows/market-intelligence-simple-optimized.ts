/**
 * @fileOverview Simple In-Memory Optimized Market Intelligence
 * 
 * This version provides immediate optimization benefits using:
 * - In-memory article cache with deduplication
 * - Timestamp-based incremental fetching
 * - Smart cache invalidation
 * - Reduced RSS feed parsing frequency
 * - AI-powered categorization for new articles
 */

'use server';

import { ai } from '@/ai/init';
import { z } from 'zod';
import Parser from 'rss-parser';
import { formatDistanceToNow, isAfter, subHours, subDays, isBefore } from 'date-fns';
import { unstable_cache as cache } from 'next/cache';
import { type RssFeed } from '@/lib/store';

// AI Categorization Schemas
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
  name: 'categorizeArticleOptimizedPrompt',
  input: { schema: CategorizationInputSchema },
  output: { schema: CategorizationOutputSchema },
  prompt: `Analyze the following real estate news article title and snippet to determine its main topic and subtopic.

Title: {{{title}}}
Snippet: {{{snippet}}}

Clean the title of any HTML tags or encoded characters before using it.
Provide a concise main topic and subtopic.`,
});

// In-memory cache
let articleCache = new Map<string, any>();
let lastFetchTime = new Map<string, Date>();
let cacheTimestamp = new Date();

const CACHE_DURATION_MINUTES = 15; // Fetch new articles every 15 minutes
const MAX_ARTICLES_PER_FEED = 50; // Limit articles per feed (increased to show more content)
const MAX_TOTAL_ARTICLES = 150; // Display up to 150 total articles (increased for better coverage)
const MAX_AI_CATEGORIZATIONS_PER_REFRESH = 10; // Limit AI calls per refresh to control costs

// Rule-based categorization keywords (to reduce AI API usage)
const CATEGORIZATION_RULES = {
  'Market Trends': [
    'market', 'trends', 'analysis', 'report', 'data', 'statistics', 'growth', 
    'decline', 'forecast', 'outlook', 'performance', 'prices', 'demand', 'supply'
  ],
  'Project Launch': [
    'launch', 'unveil', 'announce', 'new project', 'development', 'tower', 
    'villa', 'apartment', 'community', 'phase', 'construction', 'building'
  ],
  'Regulatory News': [
    'regulation', 'law', 'policy', 'government', 'ministry', 'authority', 
    'legal', 'compliance', 'permit', 'license', 'rule', 'decree'
  ],
  'Company News': [
    'emaar', 'damac', 'dubai properties', 'nakheel', 'sobha', 'danube', 
    'company', 'developer', 'ceo', 'partnership', 'acquisition', 'merger'
  ],
  'Economic Update': [
    'economy', 'economic', 'gdp', 'inflation', 'interest rate', 'mortgage', 
    'finance', 'investment', 'funding', 'capital', 'loan', 'banking'
  ],
  'Golden Visa': [
    'golden visa', 'residence', 'citizenship', 'visa', 'residency', 'expat',
    'foreign investment', 'investor visa'
  ]
};

const SUBTOPIC_RULES = {
  'Luxury Real Estate': ['luxury', 'premium', 'high-end', 'exclusive', 'penthouse', 'mansion'],
  'Off-plan Properties': ['off-plan', 'pre-launch', 'under construction', 'planned', 'upcoming'],
  'Dubai Marina': ['dubai marina', 'marina'],
  'Downtown Dubai': ['downtown', 'burj khalifa', 'dubai mall'],
  'Palm Jumeirah': ['palm jumeirah', 'palm'],
  'Business Bay': ['business bay'],
  'JLT': ['jlt', 'jumeirah lake towers'],
  'Interest Rates': ['interest', 'rate', 'mortgage rate', 'loan rate']
};

/**
 * Clean article URLs and remove tracking parameters
 * Note: Google News URLs are left as-is since they work when clicked
 */
function cleanArticleUrl(url: string): string {
  if (!url) return url;
  
  // For Google News URLs, keep them as-is (they work when clicked)
  if (url.includes('news.google.com/rss/articles/')) {
    return url;
  }
  
  // For other URLs, clean up tracking parameters
  try {
    const urlObj = new URL(url);
    // Remove common tracking parameters
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'];
    trackingParams.forEach(param => urlObj.searchParams.delete(param));
    return urlObj.toString();
  } catch (error) {
    // If URL parsing fails, return original
    return url;
  }
}

/**
 * Generate unique ID for article
 */
function generateArticleId(title: string, link: string, source: string): string {
  const combined = `${source}-${title}-${link}`;
  return Buffer.from(combined).toString('base64').slice(0, 20);
}

/**
 * Apply rule-based categorization to reduce AI API calls
 */
function categorizeWithRules(title: string, snippet: string): { mainTopic: string; subTopic: string; needsAI: boolean } {
  const textToAnalyze = `${title} ${snippet}`.toLowerCase();
  
  // Try to match main topics
  for (const [topic, keywords] of Object.entries(CATEGORIZATION_RULES)) {
    for (const keyword of keywords) {
      if (textToAnalyze.includes(keyword.toLowerCase())) {
        // Try to find subtopic
        for (const [subtopic, subKeywords] of Object.entries(SUBTOPIC_RULES)) {
          for (const subKeyword of subKeywords) {
            if (textToAnalyze.includes(subKeyword.toLowerCase())) {
              return { mainTopic: topic, subTopic: subtopic, needsAI: false };
            }
          }
        }
        
        // Found main topic but no specific subtopic
        const defaultSubtopics = {
          'Market Trends': 'General Analysis',
          'Project Launch': 'New Development',
          'Regulatory News': 'Policy Update',
          'Company News': 'Corporate News',
          'Economic Update': 'Economic Data',
          'Golden Visa': 'Residency Program'
        };
        
        return { 
          mainTopic: topic, 
          subTopic: defaultSubtopics[topic as keyof typeof defaultSubtopics] || 'General', 
          needsAI: false 
        };
      }
    }
  }
  
  // No rules matched - needs AI categorization
  return { mainTopic: 'Uncategorized', subTopic: 'N/A', needsAI: true };
}

/**
 * Check if we need to refresh a specific feed
 */
function shouldRefreshFeed(feedUrl: string): boolean {
  const lastFetch = lastFetchTime.get(feedUrl);
  if (!lastFetch) return true;
  
  const refreshThreshold = subHours(new Date(), CACHE_DURATION_MINUTES / 60);
  return isBefore(lastFetch, refreshThreshold);
}

/**
 * Optimized RSS feed fetcher with incremental updates
 */
async function fetchOptimizedFeeds(feeds: RssFeed[], forceRefresh = false): Promise<any[]> {
  const parser = new Parser({
    timeout: 8000,
    headers: {
      'User-Agent': 'Market-Intelligence-Bot/1.0'
    }
  });

  let newArticlesAdded = 0;
  const currentTime = new Date();
  
  // Get existing articles from cache
  const existingArticles = Array.from(articleCache.values());
  
  for (const feed of feeds) {
    // Skip if feed was recently fetched and not forcing refresh
    if (!forceRefresh && !shouldRefreshFeed(feed.url)) {
      console.log(`Skipping ${feed.source} - recently fetched`);
      continue;
    }

    try {
      console.log(`Fetching updates from ${feed.source}...`);
      const parsedFeed = await parser.parseURL(feed.url);
      
      if (parsedFeed.items) {
        // Process only recent articles (last 30 days)
        const thirtyDaysAgo = subDays(new Date(), 30);
        const recentItems = parsedFeed.items
          .filter((item: any) => {
            const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
            return isAfter(pubDate, thirtyDaysAgo);
          })
          .slice(0, MAX_ARTICLES_PER_FEED); // Limit per feed

        // Collect articles that need AI categorization
        const articlesNeedingAI: any[] = [];
        
        for (const item of recentItems) {
          const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
          const articleId = generateArticleId(
            item.title || '',
            item.link || '',
            feed.source
          );

          // Only add if we don't already have this article
          if (!articleCache.has(articleId)) {
            // First try rule-based categorization
            const ruleResult = categorizeWithRules(item.title || '', item.contentSnippet || '');
            
            // Clean the article URL to remove Google News redirects and tracking
            const cleanedUrl = cleanArticleUrl(item.link || '');
            
            const article = {
              id: articleId,
              source: feed.source,
              title: item.title || 'No title',
              link: cleanedUrl,
              pubDate: pubDate.toISOString(),
              relativeDate: formatRelativeDate(pubDate),
              snippet: item.contentSnippet || '',
              mainTopic: ruleResult.mainTopic,
              subTopic: ruleResult.subTopic,
              fetchedAt: currentTime.toISOString(),
            };

            articleCache.set(articleId, article);
            newArticlesAdded++;
            
            // If rules couldn't categorize, add to AI queue
            if (ruleResult.needsAI) {
              articlesNeedingAI.push(article);
            }
          }
        }
        
        // Process AI categorization in batches with limits
        if (articlesNeedingAI.length > 0) {
          console.log(`Processing ${Math.min(articlesNeedingAI.length, MAX_AI_CATEGORIZATIONS_PER_REFRESH)} articles with AI...`);
          
          // Only process up to the limit to control API costs
          const articlesToProcess = articlesNeedingAI.slice(0, MAX_AI_CATEGORIZATIONS_PER_REFRESH);
          
          for (const article of articlesToProcess) {
            try {
              const { output } = await categorizationPrompt({
                title: article.title,
                snippet: article.snippet,
              });
              
              if (output) {
                // Update the cached article
                const cachedArticle = articleCache.get(article.id);
                if (cachedArticle) {
                  cachedArticle.mainTopic = output.mainTopic;
                  cachedArticle.subTopic = output.subTopic;
                }
              }
            } catch (error) {
              console.error(`Failed to categorize article: "${article.title}"`, error);
              // Article will remain "Uncategorized" if AI fails
            }
          }
          
          // Log remaining uncategorized articles
          if (articlesNeedingAI.length > MAX_AI_CATEGORIZATIONS_PER_REFRESH) {
            console.log(`${articlesNeedingAI.length - MAX_AI_CATEGORIZATIONS_PER_REFRESH} articles remain uncategorized (API limit reached)`);
          }
        }
      }

      // Update last fetch time for this feed
      lastFetchTime.set(feed.url, currentTime);
      
    } catch (error) {
      console.error(`Failed to fetch ${feed.source}:`, error);
    }
  }

  // Clean up old articles to prevent memory bloat
  cleanupOldCachedArticles();

  console.log(`Cache update: ${newArticlesAdded} new articles added. Total: ${articleCache.size}`);
  
  // Return all cached articles, sorted by date
  return Array.from(articleCache.values()).sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );
}

/**
 * Remove articles older than 30 days from cache
 */
function cleanupOldCachedArticles(): void {
  const thirtyDaysAgo = subDays(new Date(), 30);
  const articlesToRemove: string[] = [];

  for (const [id, article] of articleCache.entries()) {
    if (isBefore(new Date(article.pubDate), thirtyDaysAgo)) {
      articlesToRemove.push(id);
    }
  }

  // Remove old articles
  articlesToRemove.forEach(id => articleCache.delete(id));

  // If still too many articles, remove oldest ones
  if (articleCache.size > MAX_TOTAL_ARTICLES) {
    const allArticles = Array.from(articleCache.entries()).sort(
      ([, a], [, b]) => new Date(a.pubDate).getTime() - new Date(b.pubDate).getTime()
    );
    
    const toRemove = allArticles.slice(0, articleCache.size - MAX_TOTAL_ARTICLES);
    toRemove.forEach(([id]) => articleCache.delete(id));
  }
}

/**
 * Smart categorization - only categorize new articles
 */
async function categorizeNewArticles(articles: any[], ai: any): Promise<any[]> {
  const fortyEightHoursAgo = subHours(new Date(), 48);
  
  // Only categorize uncategorized articles from last 48 hours
  const articlesToProcess = articles.filter(article => 
    article.mainTopic === 'Uncategorized' &&
    isAfter(new Date(article.pubDate), fortyEightHoursAgo)
  ).slice(0, 10); // Limit to 10 to avoid timeouts

  if (articlesToProcess.length === 0) {
    console.log('No new articles to categorize');
    return articles;
  }

  console.log(`Categorizing ${articlesToProcess.length} new articles...`);

  // This is a placeholder for the AI categorization
  // In the real implementation, you would use your existing AI flow
  for (const article of articlesToProcess) {
    try {
      // Placeholder for AI categorization
      // const result = await ai.categorize(article);
      
      // For now, just mark as processed
      article.mainTopic = 'Auto-Categorized';
      article.subTopic = 'Pending AI Review';
      
      // Update in cache
      articleCache.set(article.id, article);
    } catch (error) {
      console.error(`Failed to categorize: ${article.title}`, error);
    }
  }

  return articles;
}

/**
 * Main optimized aggregation function
 */
export async function aggregateMarketIntelligenceOptimized(
  feeds: RssFeed[], 
  forceRefresh = false
): Promise<any[]> {
  try {
    // Fetch optimized articles
    const articles = await fetchOptimizedFeeds(feeds, forceRefresh);
    
    // Only categorize if we have new articles or force refresh
    const shouldCategorize = forceRefresh || articles.some(a => a.mainTopic === 'Uncategorized');
    
    if (shouldCategorize) {
      // You would import your AI instance here
      // await categorizeNewArticles(articles, ai);
    }

    return articles;
  } catch (error) {
    console.error('Optimized market intelligence failed:', error);
    
    // Fallback to returning cached articles
    if (articleCache.size > 0) {
      return Array.from(articleCache.values());
    }
    
    throw error;
  }
}

/**
 * Get cache statistics for debugging
 */
export async function getCacheStats(): Promise<{
  totalArticles: number;
  cacheAge: string;
  feedFetchTimes: Record<string, string>;
}> {
  const feedTimes: Record<string, string> = {};
  for (const [url, time] of lastFetchTime.entries()) {
    feedTimes[url] = formatDistanceToNow(time, { addSuffix: true });
  }

  return {
    totalArticles: articleCache.size,
    cacheAge: formatDistanceToNow(cacheTimestamp, { addSuffix: true }),
    feedFetchTimes: feedTimes,
  };
}

/**
 * Force cache refresh for specific feeds
 */
export async function refreshSpecificFeeds(
  feeds: RssFeed[], 
  feedUrls: string[]
): Promise<any[]> {
  const feedsToRefresh = feeds.filter(feed => feedUrls.includes(feed.url));
  
  // Reset fetch time for specific feeds to force refresh
  feedUrls.forEach(url => lastFetchTime.delete(url));
  
  return await aggregateMarketIntelligenceOptimized(feedsToRefresh, true);
}

/**
 * Clear entire cache (for testing/debugging)
 */
export async function clearCache(): Promise<void> {
  articleCache.clear();
  lastFetchTime.clear();
  cacheTimestamp = new Date();
  console.log('Cache cleared');
}

function formatRelativeDate(date: Date): string {
  const formatted = formatDistanceToNow(date, { addSuffix: true });
  return formatted
    .replace('about ', '')
    .replace(' minutes', 'm ago')
    .replace(' minute', 'm ago') 
    .replace(' hours', 'h ago')
    .replace(' hour', 'h ago');
}