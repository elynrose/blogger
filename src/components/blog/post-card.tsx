import Link from 'next/link';
import Image from 'next/image';
import type { BlogPost } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CalendarDays } from 'lucide-react';

type PostCardProps = {
  post: BlogPost;
};

export function PostCard({ post }: PostCardProps) {
  return (
    <Card className="h-full flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-border/75 hover:border-primary/50">
        <CardHeader className="p-0">
          <Link href={`/posts/${post.slug}`} className="group block">
            <div className="relative h-48 w-full">
              <Image
                src={post.imageUrl}
                alt={post.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                data-ai-hint={post.imageHint}
              />
              {post.subscriptionRequired && (
                <Badge className="absolute right-3 top-3 border border-yellow-200 bg-yellow-100 text-[10px] uppercase tracking-wide text-yellow-900">
                  Subscribers
                </Badge>
              )}
            </div>
          </Link>
        </CardHeader>
        <CardContent className="flex-grow p-6">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="font-headline text-xl leading-tight mb-2">
              <Link href={`/posts/${post.slug}`} className="group block hover:text-primary transition-colors">
                {post.title}
              </Link>
            </CardTitle>
          </div>
          {post.category && post.categoryId && (
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Category:{' '}
              <Link
                href={`/categories/${encodeURIComponent(post.categoryId)}`}
                className="text-foreground hover:text-primary transition-colors"
              >
                {post.category}
              </Link>
            </p>
          )}
        <p className="text-muted-foreground text-sm line-clamp-3 min-h-[3.75rem]">
          {post.excerpt}
        </p>
        {post.tags && post.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 min-h-[1.5rem]">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                href={`/tags/${encodeURIComponent(tag)}`}
                className="rounded-full border border-foreground/20 bg-foreground/5 px-2 py-0.5 text-xs font-medium text-foreground"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}
        </CardContent>
        <CardFooter className="p-6 pt-0 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                    <AvatarImage src={post.authorImageUrl} alt={post.author} data-ai-hint={post.authorImageHint} />
                    <AvatarFallback>{post.author.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{post.author}</span>
            </div>
            <div className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                <span>{new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </div>
        </CardFooter>
      </Card>
  );
}
