import type { BlogPost } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const getImage = (id: string) => {
    const image = PlaceHolderImages.find(img => img.id === id);
    if (!image) {
        // Fallback or error
        return { imageUrl: 'https://picsum.photos/seed/error/1200/800', imageHint: 'error' };
    }
    return { imageUrl: image.imageUrl, imageHint: image.imageHint };
}

const getAuthorImage = (id: string) => {
    const image = PlaceHolderImages.find(img => img.id === id);
    if (!image) {
        // Fallback or error
        return { authorImageUrl: 'https://picsum.photos/seed/error-author/100/100', authorImageHint: 'error' };
    }
    return { authorImageUrl: image.imageUrl, authorImageHint: image.imageHint };
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'getting-started-with-gen-ai',
    title: 'Getting Started with Generative AI for Content Creation',
    excerpt: 'Explore how generative AI is revolutionizing content creation and discover top tools to get you started.',
    ...getImage('blog-post-1'),
    author: 'Alex Doe',
    ...getAuthorImage('author-1'),
    date: '2024-07-28',
    content: `Generative AI is transforming the landscape of digital content. From writing articles to creating stunning visuals, AI tools are becoming indispensable for creators. In this post, we'll dive into the basics of generative AI and look at some of the most popular SaaS products in this space.

One of the leading tools for text generation is Copy.ai. It helps you craft everything from blog posts to social media updates in minutes. [AFFILIATE_LINK_1]

For visuals, Midjourney and DALL-E 3 are at the forefront. They can turn simple text prompts into breathtaking images. These tools are perfect for blog illustrations, ad creatives, and more.

As you get more advanced, you might explore platforms like RunwayML, which brings generative AI to video. The possibilities are truly endless. We have included a great video tutorial below to help you get started.`,
    videoUrl: 'https://www.youtube.com/watch?v=s_ht4AKnCw4',
    affiliateLinks: [
      {
        text: 'Try Copy.ai today and supercharge your writing!',
        url: '#',
      },
    ],
  },
  {
    slug: 'ai-in-customer-support',
    title: 'How AI is Revolutionizing Customer Support',
    excerpt: 'Learn how AI-powered chatbots and support platforms can enhance customer satisfaction and efficiency.',
    ...getImage('blog-post-2'),
    author: 'Jane Smith',
    ...getAuthorImage('author-2'),
    date: '2024-07-25',
    content: `In today's fast-paced digital world, customers expect instant support. AI-powered solutions are making this a reality. Chatbots, intelligent routing, and automated responses are no longer sci-fi concepts but essential business tools.

A key player in this field is Intercom. Their platform combines automated bots with a powerful live chat system, allowing businesses to provide seamless support. [AFFILIATE_LINK_1]

Another excellent tool is Zendesk. Their AI, "Answer Bot," can deflect common questions, freeing up human agents to handle more complex issues. [AFFILIATE_LINK_2]

Implementing these tools can lead to significant improvements in response times and customer satisfaction. The key is to find the right balance between automation and the human touch.`,
    affiliateLinks: [
      {
        text: "Learn more about Intercom's AI capabilities.",
        url: '#',
      },
      {
        text: 'Explore Zendesk for your support team.',
        url: '#',
      },
    ],
  },
    {
    slug: 'top-ai-coding-assistants',
    title: 'Top 5 AI Coding Assistants to Boost Your Productivity',
    excerpt: 'From autocompletion to debugging, AI coding assistants are changing the game for developers. Here are our top picks.',
    ...getImage('blog-post-3'),
    author: 'Alex Doe',
    ...getAuthorImage('author-1'),
    date: '2024-07-22',
    content: `Developers, rejoice! The days of tedious boilerplate and endless debugging are being shortened by the power of AI. AI coding assistants integrate directly into your IDE, offering intelligent suggestions, code completion, and even generating entire functions from a comment.

The undisputed leader in this space is GitHub Copilot. Powered by OpenAI's models, it's like having a pair programmer with you at all times. [AFFILIATE_LINK_1]

Another strong contender is Tabnine. It offers excellent code completions and can be run locally for enhanced privacy.

Lastly, Amazon's CodeWhisperer is a fantastic free alternative that provides robust features, especially for those working within the AWS ecosystem.

These tools don't just write code; they help you learn faster, explore new libraries, and focus on the complex logic that matters most. Below is a tutorial that shows how to integrate these tools into your workflow.`,
    videoUrl: 'https://www.youtube.com/watch?v=3lhn280bjwM',
    affiliateLinks: [
      {
        text: 'Get started with GitHub Copilot.',
        url: '#',
      },
    ],
  },
];
