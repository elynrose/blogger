'use server';
/**
 * @fileOverview An AI SaaS product recommendation agent.
 *
 * - generateAISaaSRecommendations - A function that suggests relevant AI SaaS products for a given blog post topic.
 * - GenerateAISaaSRecommendationsInput - The input type for the generateAISaaSRecommendations function.
 * - GenerateAISaaSRecommendationsOutput - The return type for the generateAISaaSRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateAISaaSRecommendationsInputSchema = z.object({
  blogPostTopic: z
    .string()
    .describe('The topic of the blog post for which AI SaaS products are to be recommended.'),
});
export type GenerateAISaaSRecommendationsInput = z.infer<typeof GenerateAISaaSRecommendationsInputSchema>;

const GenerateAISaaSRecommendationsOutputSchema = z.object({
  aiSaaSProducts: z
    .array(z.string())
    .describe('A list of relevant AI SaaS products for the given blog post topic.'),
});
export type GenerateAISaaSRecommendationsOutput = z.infer<typeof GenerateAISaaSRecommendationsOutputSchema>;

export async function generateAISaaSRecommendations(input: GenerateAISaaSRecommendationsInput): Promise<GenerateAISaaSRecommendationsOutput> {
  return generateAISaaSRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAISaaSRecommendationsPrompt',
  input: {schema: GenerateAISaaSRecommendationsInputSchema},
  output: {schema: GenerateAISaaSRecommendationsOutputSchema},
  prompt: `You are an AI SaaS expert. Your job is to recommend relevant AI SaaS products for a given blog post topic.

Topic: {{{blogPostTopic}}}

Recommend 3 AI SaaS products that would be a good fit for this blog post topic. Return a simple comma separated list of product names.`, 
});

const generateAISaaSRecommendationsFlow = ai.defineFlow(
  {
    name: 'generateAISaaSRecommendationsFlow',
    inputSchema: GenerateAISaaSRecommendationsInputSchema,
    outputSchema: GenerateAISaaSRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return {
      aiSaaSProducts: output!.aiSaaSProducts,
    };
  }
);
