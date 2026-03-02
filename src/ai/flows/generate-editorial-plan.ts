'use server';

/**
 * @fileOverview Generates a weekly editorial plan based on market intelligence and competitor analysis.
 *
 * - generateEditorialPlan - A function that handles the editorial plan generation.
 * - EditorialPlanInput - The input type for the generateEditorialPlan function.
 * - EditorialPlanOutput - The return type for the generateEditorialPlan function.
 */

import { ai } from '@/ai/init';
import { z } from 'genkit';
import {
  type MarketIntelligenceOutput,
} from './market-intelligence-aggregator';
import { type CompetitorWatchOutput } from './schemas';

const EditorialPlanInputSchema = z.object({
  marketPulse: z.any().describe("Array of recent news articles from the market intelligence feed."),
  competitorArticles: z.any().describe("Array of recent articles published by competitors."),
  recentTopics: z.string().optional().describe("A comma-separated list of topics our own blog has recently covered."),
});
export type EditorialPlanInput = z.infer<typeof EditorialPlanInputSchema>;

const ArticleIdeaSchema = z.object({
    title: z.string().describe("A compelling, SEO-friendly headline for the proposed article."),
    angle: z.string().describe("The strategic reason or unique angle for this content piece (e.g., 'Address a market gap,' 'Counter a competitor')."),
    talkingPoints: z.array(z.string()).describe("A bulleted list of key points, questions, or data to include in the article."),
    targetAudience: z.string().describe("The primary target audience for this article (e.g., 'First-time investors,' 'High-net-worth individuals')."),
    supportingArticles: z.array(z.object({
        title: z.string().describe("The title of the source article."),
        link: z.string().url().describe("The direct URL to the source article."),
    })).describe("A list of the source articles (from Market Intelligence or Competitor Content) that support this idea.")
});

const EditorialPlanOutputSchema = z.object({
    plan: z.array(ArticleIdeaSchema).describe("A prioritized list of 3-5 concrete article ideas for the week.")
});
export type EditorialPlanOutput = z.infer<typeof EditorialPlanOutputSchema>;


export async function generateEditorialPlan(
  input: EditorialPlanInput
): Promise<EditorialPlanOutput> {
  return generateEditorialPlanFlow(input);
}


const generateEditorialPlanPrompt = ai.definePrompt({
  name: 'generateEditorialPlanPrompt',
  input: { schema: EditorialPlanInputSchema },
  output: { schema: EditorialPlanOutputSchema },
  prompt: `You are an expert Content Strategist for a major real estate brokerage in Dubai. Your task is to create a prioritized weekly editorial plan based on market news, competitor activity, and our own recently published content.

Your goal is to bridge the gap between what's happening in the market and the content on our website, ensuring we are timely, relevant, and strategic.

Here is your data:

1.  **Market Intelligence Feed (Articles with titles and links):**
    {{#each marketPulse}}
    - Title: "{{{this.title}}}"
      Source: {{{this.source}}}
      Link: {{{this.link}}}
    {{/each}}

2.  **Competitor Content (Articles with titles and links):**
    {{#each competitorArticles}}
    - Title: "{{{this.title}}}"
      Competitor: {{{this.competitor}}}
      Link: {{{this.link}}}
    {{/each}}

3.  **Topics We Recently Covered (to avoid repetition):**
    "{{{recentTopics}}}"

**Your Task:**

1.  **Synthesize & Cluster:** Analyze all the input article titles. Identify the 3-5 most significant, high-level themes or topics that are currently trending. (e.g., "Off-plan project launches," "Changes in mortgage rates," "Luxury market trends").
2.  **Gap Analysis:** Compare these trending themes to the topics we've recently covered. Identify the most valuable content gaps. A gap could be a major market trend we haven't discussed, or a topic a competitor is dominating that we should challenge.
3.  **Prioritize & Recommend:** Based on the gaps and trend velocity, generate a prioritized list of 3 to 5 concrete article ideas.

For each recommended article, provide:
-   **title:** A compelling, SEO-friendly headline.
-   **angle:** The strategic "why" behind the article. What gap does it fill? What conversation does it join?
-   **talkingPoints:** A bulleted list of key questions, data points, or subtopics to guide the writer.
-   **targetAudience:** Who is this for?
-   **supportingArticles**: A list of 1 to 3 of the most relevant articles from the provided lists above that justify this idea. When you reference an article, use its EXACT title and corresponding link from the lists above. Make sure the link matches the title you're referencing.
`,
});


const generateEditorialPlanFlow = ai.defineFlow(
  {
    name: 'generateEditorialPlanFlow',
    inputSchema: EditorialPlanInputSchema,
    outputSchema: EditorialPlanOutputSchema,
  },
  async (input): Promise<EditorialPlanOutput> => {
    // Take only the first 50 market pulse articles to keep the prompt concise
    const conciseMarketPulse = input.marketPulse?.slice(0, 50) || [];

    // First attempt with the full prompt
    try {
      const { output } = await generateEditorialPlanPrompt({
          ...input,
          marketPulse: conciseMarketPulse,
      });

      return validateAndFixOutput(output, conciseMarketPulse);

    } catch (firstError) {
      console.warn('First attempt failed, trying with simplified input:', firstError);
      
      // Second attempt with reduced data
      try {
        const simplifiedMarketPulse = conciseMarketPulse.slice(0, 10);
        const simplifiedCompetitorArticles = input.competitorArticles?.slice(0, 5) || [];
        
        const { output } = await generateEditorialPlanPrompt({
          marketPulse: simplifiedMarketPulse,
          competitorArticles: simplifiedCompetitorArticles,
          recentTopics: input.recentTopics || "",
        });

        return validateAndFixOutput(output, simplifiedMarketPulse);

      } catch (secondError) {
        console.error('Second attempt also failed, using fallback:', secondError);
        
        // Provide a fallback response structure
        const fallbackResponse: EditorialPlanOutput = {
          plan: [
            {
              title: "Market Analysis Update: Current Real Estate Trends",
              angle: "Provide readers with timely market insights based on recent developments",
              talkingPoints: [
                "Review recent market data and trends",
                "Analyze impact on different property segments", 
                "Provide actionable insights for investors"
              ],
              targetAudience: "Real estate investors and homebuyers",
              supportingArticles: conciseMarketPulse.slice(0, 3).map((article: any) => ({
                title: article.title || "Market Update",
                link: article.link || "#"
              }))
            }
          ]
        };

        console.log('Using fallback editorial plan response');
        return fallbackResponse;
      }
    }
  }
);

// Helper function to validate and fix AI output
function validateAndFixOutput(output: any, fallbackArticles: any[]): EditorialPlanOutput {
  // Validate that output exists and has the expected structure
  if (!output) {
    throw new Error('AI generated no output');
  }

  // If output is missing the 'plan' property, try to extract it from the response
  if (!output.plan) {
    console.warn('AI response missing plan property:', JSON.stringify(output, null, 2));
    
    // Cast to any to handle dynamic response structure
    const anyOutput = output as any;
    
    // If the output is an array directly, wrap it in a plan property
    if (Array.isArray(anyOutput)) {
      return { plan: anyOutput };
    }
    
    // If there's no plan property but the output looks like article ideas, try to restructure
    if (anyOutput.title || anyOutput.angle) {
      // Single article returned, wrap in array
      return { plan: [anyOutput] };
    }

    // Try to find any array in the response that could be the plan
    for (const [key, value] of Object.entries(anyOutput)) {
      if (Array.isArray(value) && value.length > 0 && (value[0] as any)?.title) {
        console.log(`Found potential plan array in property: ${key}`);
        return { plan: value as any };
      }
    }
    
    throw new Error('AI response does not contain a valid plan structure');
  }

  // Validate that plan is an array
  if (!Array.isArray(output.plan)) {
    throw new Error('Plan property is not an array');
  }

  // Validate that each plan item has required properties
  output.plan.forEach((item: any, index: number) => {
    if (!item.title || !item.angle) {
      throw new Error(`Plan item ${index} missing required properties (title or angle)`);
    }
  });

  return output;
}
