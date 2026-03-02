'use server';

import { aiAssistedContentBlueprinting, type AIAssistedContentBlueprintingOutput } from '@/ai/flows/ai-assisted-content-blueprinting';
import { z } from 'zod';

const BlueprintingSchema = z.object({
  topic: z.string().min(5, "Topic must be at least 5 characters long."),
  keywords: z.string().min(3, "Please provide at least one keyword."),
  serpData: z.string().optional(),
  competitorOutlines: z.string().optional(),
  toneGuide: z.string().min(10, "Tone guide must be at least 10 characters long."),
  supportingArticles: z.array(z.object({
    title: z.string(),
    link: z.string().url(),
    source: z.string().optional(),
  })).optional(),
});

export type BlueprintingFormState = {
  status: 'idle' | 'loading' | 'success' | 'error';
  message: string;
  errors?: {
    topic?: string[];
    keywords?: string[];
    toneGuide?: string[];
  };
  data: AIAssistedContentBlueprintingOutput | null;
}

export async function submitContentBlueprint(
  prevState: BlueprintingFormState,
  formData: FormData
): Promise<BlueprintingFormState> {
  // Parse supporting articles from form data if provided
  let supportingArticles;
  const supportingArticlesData = formData.get('supportingArticles');
  if (supportingArticlesData && typeof supportingArticlesData === 'string') {
    try {
      supportingArticles = JSON.parse(supportingArticlesData);
    } catch {
      supportingArticles = undefined;
    }
  }

  const validatedFields = BlueprintingSchema.safeParse({
    topic: formData.get('topic'),
    keywords: formData.get('keywords'),
    serpData: formData.get('serpData'),
    competitorOutlines: formData.get('competitorOutlines'),
    toneGuide: formData.get('toneGuide'),
    supportingArticles: supportingArticles,
  });

  if (!validatedFields.success) {
    return {
      status: 'error',
      message: 'Please correct the errors below.',
      errors: validatedFields.error.flatten().fieldErrors,
      data: null,
    };
  }

  try {
    const result = await aiAssistedContentBlueprinting({
      ...validatedFields.data,
      serpData: validatedFields.data.serpData || 'Not provided',
      competitorOutlines: validatedFields.data.competitorOutlines || 'Not provided',
      supportingArticles: validatedFields.data.supportingArticles,
    });
    return { status: 'success', message: 'Blueprint generated successfully.', data: result };
  } catch (error) {
    console.error(error);
    return { status: 'error', message: 'An unexpected error occurred.', data: null };
  }
}
