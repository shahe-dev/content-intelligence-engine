'use server';

import {
  generateEditorialPlan,
  type EditorialPlanOutput,
} from '@/ai/flows/generate-editorial-plan';
import { aggregateMarketIntelligence } from '@/ai/flows/market-intelligence-aggregator';
import { competitorWatch } from '@/ai/flows/competitor-watch';
import { z } from 'zod';
import { type Competitor, type RssFeed } from '@/lib/store';
import { type CompetitorArticle } from '@/ai/flows/schemas';
import { type MarketIntelligenceOutput } from '@/ai/flows/market-intelligence-aggregator';


const EditorialPlanSchema = z.object({
  recentTopics: z.string().optional(),
  planName: z.string().min(1, "Plan name is required."),
  selectedArticles: z.string().optional(), // JSON string of selected articles
  excludedArticles: z.string().optional(), // JSON string of excluded article links
  rssFeeds: z.string(), // JSON string of RSS feeds
  competitors: z.string(), // JSON string of competitors
});

export type EditorialPlanFormState = {
  status: 'idle' | 'loading' | 'success' | 'error';
  message: string;
  data: EditorialPlanOutput | null;
};

function isMarketIntelArticle(article: any): article is MarketIntelligenceOutput[0] {
    return 'mainTopic' in article;
}


export async function submitEditorialPlan(
  prevState: EditorialPlanFormState,
  formData: FormData
): Promise<EditorialPlanFormState> {

  const validatedFields = EditorialPlanSchema.safeParse({
    recentTopics: formData.get('recentTopics'),
    planName: formData.get('planName'),
    selectedArticles: formData.get('selectedArticles'),
    excludedArticles: formData.get('excludedArticles'),
    rssFeeds: formData.get('rssFeeds'),
    competitors: formData.get('competitors'),
  });

  if (!validatedFields.success) {
      return {
          status: 'error',
          message: 'Invalid form data.',
          data: null,
      }
  }

  try {
    const { 
        selectedArticles: selectedArticlesJson, 
        excludedArticles: excludedArticlesJson,
        rssFeeds: rssFeedsJson,
        competitors: competitorsJson,
        ...rest 
    } = validatedFields.data;

    const rssFeeds: RssFeed[] = JSON.parse(rssFeedsJson);
    const competitors: Competitor[] = JSON.parse(competitorsJson);
    
    let marketPulse: MarketIntelligenceOutput = [];
    let competitorArticles: CompetitorArticle[] = [];

    // Inclusion Mode: If articles are explicitly selected, use only them.
    if (selectedArticlesJson && selectedArticlesJson.length > 2) { // check for '[]'
      const parsedArticles: (MarketIntelligenceOutput[0] | CompetitorArticle)[] = JSON.parse(selectedArticlesJson);
      
      parsedArticles.forEach(article => {
        if (isMarketIntelArticle(article)) {
          marketPulse.push(article);
        } else {
          competitorArticles.push(article);
        }
      });

    } else {
      // Default/Exclusion Mode: Fetch all articles.
      marketPulse = await aggregateMarketIntelligence(rssFeeds);
      competitorArticles = await competitorWatch(marketPulse, competitors);

      // If there are exclusions, filter them out.
      if (excludedArticlesJson && excludedArticlesJson.length > 2) {
          const excludedLinks: string[] = JSON.parse(excludedArticlesJson);
          
          marketPulse = marketPulse.filter(article => !excludedLinks.includes(article.link));
          competitorArticles = competitorArticles.filter(article => !excludedLinks.includes(article.link));
      }
    }
    
    // Call the AI flow with the prepared data
    const result = await generateEditorialPlan({
      marketPulse,
      competitorArticles,
      recentTopics: validatedFields.data.recentTopics,
    });

    return {
      status: 'success',
      message: 'Editorial plan generated successfully.',
      data: result,
    };
  } catch (error) {
    console.error('Editorial plan generation error:', error);
    
    let errorMessage = 'An unexpected error occurred while generating the editorial plan.';
    
    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes('Schema validation failed') || error.message.includes('must have required property')) {
        errorMessage = 'The AI service returned an unexpected response format. Please try again, and if the issue persists, contact support.';
      } else if (error.message.includes('AI generated no output')) {
        errorMessage = 'The AI service did not provide a response. Please check your internet connection and try again.';
      } else if (error.message.includes('plan structure')) {
        errorMessage = 'The generated plan could not be properly formatted. A basic plan has been provided instead.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return { status: 'error', message: errorMessage, data: null };
  }
}
