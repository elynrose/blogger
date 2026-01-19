'use server';

import { generateAISaaSRecommendations } from '@/ai/flows/generate-ai-saas-recommendations';
import { z } from 'zod';

const schema = z.object({
  topic: z.string().min(10, 'Please enter a topic with at least 10 characters.'),
});

type State = {
  message?: string | null;
  errors?: {
    topic?: string[];
  } | null;
  recommendations?: string[] | null;
}

export async function getRecommendations(prevState: State | null, formData: FormData): Promise<State> {
  const validatedFields = schema.safeParse({
    topic: formData.get('topic'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Validation failed',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  try {
    const result = await generateAISaaSRecommendations({ blogPostTopic: validatedFields.data.topic });
    return {
      message: 'Success',
      recommendations: result.aiSaaSProducts,
    };
  } catch (error) {
    console.error('AI Recommendation Error:', error);
    return {
      message: 'An error occurred while generating recommendations. Please try again.',
      recommendations: [],
    };
  }
}
