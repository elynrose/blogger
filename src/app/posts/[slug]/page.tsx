import { notFound } from 'next/navigation';
import Image from 'next/image';
import { blogPosts } from '@/lib/data';
import type { BlogPost } from '@/lib/types';
import type { Metadata } from 'next';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarDays } from 'lucide-react';
import { VideoEmbed } from '@/components/blog/video-embed';
import { AffiliateLink } from '@/components/blog/affiliate-link';

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = blogPosts.find(p => p.slug === params.slug);
  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }
  return {
    title: `${post.title} | AISaaS Explorer`,
    description: post.excerpt,
  };
}

// Function to parse content and replace placeholders with components
const parseContent = (post: BlogPost) => {
  if (!post.content) return [];
  
  const contentParts = post.content.split(/(\[AFFILIATE_LINK_\d+\])/g);
  
  return contentParts.map((part, index) => {
    const match = part.match(/\[AFFILIATE_LINK_(\d+)\]/);
    if (match) {
      const linkIndex = parseInt(match[1], 10) - 1;
      if (post.affiliateLinks && post.affiliateLinks[linkIndex]) {
        return <AffiliateLink key={`link-${index}`} href={post.affiliateLinks[linkIndex].url}>{post.affiliateLinks[linkIndex].text}</AffiliateLink>;
      }
      return null;
    }
    // split by newlines to create paragraphs
    return part.split('\n\n').map((paragraph, pIndex) => (
      paragraph.trim() && <p key={`p-${index}-${pIndex}`} className="mb-6 leading-relaxed text-lg">{paragraph}</p>
    ));
  }).flat().filter(Boolean);
}

export default function PostPage({ params }: Props) {
  const post = blogPosts.find(p => p.slug === params.slug);

  if (!post) {
    notFound();
  }
  
  const contentWithLinks = parseContent(post);

  return (
    <article className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
      <header className="mb-8">
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-4">{post.title}</h1>
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={post.authorImageUrl} alt={post.author} data-ai-hint={post.authorImageHint} />
              <AvatarFallback>{post.author.charAt(0)}</AvatarFallback>
            </Avatar>
            <span>{post.author}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" />
            <span>{new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
      </header>
      
      <div className="relative h-64 md:h-96 w-full rounded-lg overflow-hidden mb-8 shadow-lg">
        <Image
          src={post.imageUrl}
          alt={post.title}
          fill
          className="object-cover"
          priority
          data-ai-hint={post.imageHint}
        />
      </div>

      <div className="max-w-none text-foreground/90">
        {contentWithLinks}
      </div>

      {post.videoUrl && (
        <section className="mt-12">
          <h2 className="text-3xl font-headline font-bold mb-4">Video Tutorial</h2>
          <VideoEmbed url={post.videoUrl} />
        </section>
      )}

    </article>
  );
}
