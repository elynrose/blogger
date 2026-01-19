'use server';
/**
 * @fileOverview A blog post generation AI agent.
 *
 * - generatePost - A function that generates a blog post from a topic and summary.
 * - GeneratePostInput - The input type for the generatePost function.
 * - GeneratePostOutput - The return type for the generatePost function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePostInputSchema = z.object({
  topic: z.string().describe('The topic of the blog post.'),
  summary: z.string().describe('A brief summary or outline of the blog post content.'),
});
export type GeneratePostInput = z.infer<typeof GeneratePostInputSchema>;

const GeneratePostOutputSchema = z.object({
  title: z.string().describe('The generated title of the blog post.'),
  content: z
    .string()
    .describe(
      'The generated content of the blog post, formatted in Markdown with paragraphs separated by double newlines.'
    ),
});
export type GeneratePostOutput = z.infer<typeof GeneratePostOutputSchema>;

export async function generatePost(input: GeneratePostInput): Promise<GeneratePostOutput> {
  return generatePostFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePostPrompt',
  input: {schema: GeneratePostInputSchema},
  output: {schema: GeneratePostOutputSchema},
  prompt: `You are an expert content creator specializing in blog posts about AI SaaS products.
Your tone is informative, engaging, and slightly informal.

Generate a blog post based on the following topic and summary.

Topic: {{{topic}}}
Summary: {{{summary}}}

The output should be a JSON object with a "title" and "content" field.
The "title" should be a catchy and relevant headline for the blog post.
The "content" should be the full blog post text, written in Markdown.
Ensure paragraphs are separated by double newlines (\n\n). Do not include any affiliate link placeholders like [AFFILIATE_LINK_1].
`,
});

const generatePostFlow = ai.defineFlow(
  {
    name: 'generatePostFlow',
    inputSchema: GeneratePostInputSchema,
    outputSchema: GeneratePostOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
