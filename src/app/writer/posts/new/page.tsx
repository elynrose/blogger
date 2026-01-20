'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PostGeneratorTool } from '@/components/ai/post-generator-tool';

export default function WriterNewPostPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <Link href="/writer/posts">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Posts
          </Button>
        </Link>
      </div>
      <PostGeneratorTool />
    </div>
  );
}
