import { RecommendationTool } from '@/components/ai/recommendation-tool';

export default function RecommendationsPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-headline font-bold text-primary">
          AI SaaS Advisor
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          Stuck for ideas? Enter a blog post topic and our AI will suggest relevant SaaS products to feature.
        </p>
      </div>
      <RecommendationTool />
    </div>
  );
}
