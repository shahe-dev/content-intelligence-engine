// A Genkit Flow that uses GPT and SERP data to generate skeleton drafts and outlines for content pieces.

'use server';

import {ai} from '@/ai/init';
import {z} from 'genkit';

/**
 * @fileOverview AI-Assisted Content Blueprinting Flow.
 *
 * This flow uses GPT and SERP data to generate skeleton drafts and outlines for content pieces.
 * It accelerates the content creation process and ensures SEO optimization from the start.
 *
 * - aiAssistedContentBlueprinting - A function that handles the content blueprinting process.
 * - AIAssistedContentBlueprintingInput - The input type for the aiAssistedContentBlueprinting function.
 * - AIAssistedContentBlueprintingOutput - The return type for the aiAssistedContentBlueprinting function.
 */

const AIAssistedContentBlueprintingInputSchema = z.object({
  topic: z.string().describe('The main topic for the content piece.'),
  keywords: z.string().describe('Target keywords for SEO optimization, separated by commas.'),
  serpData: z.string().describe('SERP data for the topic, including titles and descriptions of top-ranking pages.'),
  competitorOutlines: z.string().describe('Outlines of competitor content pieces.'),
  toneGuide: z.string().describe('Tone guide to enforce style consistency.'),
  supportingArticles: z.array(z.object({
    title: z.string().describe('The title of the supporting article.'),
    link: z.string().url().describe('The direct URL to the supporting article.'),
    source: z.string().optional().describe('The source publication of the article.'),
  })).optional().describe('Supporting articles from market intelligence that relate to this topic.'),
});

export type AIAssistedContentBlueprintingInput = z.infer<
  typeof AIAssistedContentBlueprintingInputSchema
>;

const AIAssistedContentBlueprintingOutputSchema = z.object({
  outline: z.string().describe('A detailed outline for the content piece.'),
  seoBrief: z
    .string()
    .describe(
      'SEO brief with keyword intent, headings, alt-text suggestions, schema recommendations, and internal links.'
    ),
  draftIntro: z.string().describe('Pre-drafted introduction for the content piece.'),
});

export type AIAssistedContentBlueprintingOutput = z.infer<
  typeof AIAssistedContentBlueprintingOutputSchema
>;

export async function aiAssistedContentBlueprinting(
  input: AIAssistedContentBlueprintingInput
): Promise<AIAssistedContentBlueprintingOutput> {
  return aiAssistedContentBlueprintingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiAssistedContentBlueprintingPrompt',
  input: {schema: AIAssistedContentBlueprintingInputSchema},
  output: {schema: AIAssistedContentBlueprintingOutputSchema},
  config: {
    temperature: 0.3,
  },
  prompt: `Create a content blueprint for: {{{topic}}}

Target keywords: {{{keywords}}}
Tone: {{{toneGuide}}}

{{#if supportingArticles}}
Supporting articles to reference:
{{#each supportingArticles}}
- {{{this.title}}} - {{{this.link}}}
{{/each}}
{{/if}}

Generate exactly these three sections:

outline: A detailed content outline in markdown format with ## headings and subheadings.{{#if supportingArticles}} Incorporate insights from the supporting articles.{{/if}}

seoBrief: A comprehensive SEO brief including keyword intent, primary keywords, content structure recommendations, meta description, alt-text suggestions, schema recommendations, and internal linking opportunities.{{#if supportingArticles}} Include how to reference the supporting articles.{{/if}}

draftIntro: An engaging introduction paragraph that hooks readers.{{#if supportingArticles}} Weave in recent developments from the supporting articles.{{/if}}

Respond with actual content for {{{topic}}}, not instructions or explanations.`,
});

const aiAssistedContentBlueprintingFlow = ai.defineFlow(
  {
    name: 'aiAssistedContentBlueprintingFlow',
    inputSchema: AIAssistedContentBlueprintingInputSchema,
    outputSchema: AIAssistedContentBlueprintingOutputSchema,
  },
  async input => {
    try {
      const result = await prompt(input);
      
      if (result?.output) {
        console.log('Blueprint generation successful');
        return result.output;
      }
      
      throw new Error('No output received from AI prompt');
    } catch (error) {
      console.error('Blueprint generation failed:', error);
      throw error;
    }
  }
);
