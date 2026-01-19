'use server';

import { generatePost } from '@/ai/flows/generate-post-flow';
import { z } from 'zod';

const schema = z.object({
  topic: z.string().min(10, 'Please enter a topic with at least 10 characters.'),
  summary: z.string().min(20, 'Please enter a summary with at least 20 characters.'),
});

type State = {
  message?: string | null;
  errors?: {
    topic?: string[];
    summary?: string[];
  } | null;
  generatedPost?: {
    title: string;
    content: string;
  } | null;
}

export async function createPost(prevState: State | null, formData: FormData): Promise<State> {
  const validatedFields = schema.safeParse({
    topic: formData.get('topic'),
    summary: formData.get('summary'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Validation failed',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const result = await generatePost({ 
      topic: validatedFields.data.topic,
      summary: validatedFields.data.summary,
    });
    return {
      message: 'Success',
      generatedPost: result,
    };
  } catch (error) {
    console.error('AI Post Generation Error:', error);
    return {
      message: 'An error occurred while generating the post. Please try again.',
      generatedPost: null,
    };
  }
}
