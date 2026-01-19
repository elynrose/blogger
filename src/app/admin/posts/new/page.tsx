import { PostGeneratorTool } from '@/components/ai/post-generator-tool';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function NewPostPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <Link href="/admin/posts">
            <Button variant="ghost">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Posts
            </Button>
        </Link>
      </div>
      <PostGeneratorTool />
    </div>
  );
}
