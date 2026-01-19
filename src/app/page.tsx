'use client';

import { PostCard } from '@/components/blog/post-card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { BlogPost } from '@/lib/types';
import { collection, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { useMemo } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';


// Firestore post structure
interface PostDocument {
  id: string;
  title: string;
  content: string;
  createdAt: Timestamp;
  publishDate?: Timestamp;
  status: 'draft' | 'published';
  imageUrl?: string;
  authorId: string;
  authorName: string;
}

function PostCardSkeleton() {
    return (
        <div className="group block">
            <Card className="h-full flex flex-col overflow-hidden">
                <CardHeader className="p-0">
                <div className="relative h-48 w-full">
                    <Skeleton className="h-full w-full" />
                </div>
                </CardHeader>
                <CardContent className="flex-grow p-6">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <div className="space-y-2 mt-4">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                    </div>
                </CardContent>
                <CardFooter className="p-6 pt-0 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-4 w-24" />
                </CardFooter>
            </Card>
        </div>
    );
}

export default function Home() {
  const firestore = useFirestore();

  const postsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'posts'),
      where('status', '==', 'published'),
      orderBy('publishDate', 'desc')
    );
  }, [firestore]);

  const { data: posts, isLoading } = useCollection<PostDocument>(postsQuery);

  const mappedPosts: BlogPost[] | null = useMemo(() => {
    if (!posts) return null;
    return posts.map(post => {
      const authorName = post.authorName || 'AISaaS Explorer';
      const excerpt = post.content ? post.content.substring(0, 150) + '...' : '';
      const date = post.publishDate ? post.publishDate.toDate() : post.createdAt.toDate();

      return {
        slug: post.id,
        title: post.title,
        excerpt,
        imageUrl: post.imageUrl || 'https://picsum.photos/seed/' + post.id + '/1200/800',
        imageHint: 'technology',
        author: authorName,
        // The user document doesn't have an image URL. I'll use a placeholder.
        authorImageUrl: 'https://picsum.photos/seed/' + post.authorId + '/100/100',
        authorImageHint: 'person portrait',
        date: date.toISOString(),
        content: post.content,
      };
    });
  }, [posts]);
  

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <section className="text-center py-16 sm:py-24">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-headline font-bold tracking-tight text-primary">
          Explore the World of AI-Powered SaaS
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          Your ultimate guide to the best AI software, with hands-on tutorials and exclusive insights.
        </p>
      </section>

      <section className="pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading && Array.from({ length: 3 }).map((_, i) => (
             <PostCardSkeleton key={i} />
          ))}
          {!isLoading && mappedPosts && mappedPosts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
          {!isLoading && (!mappedPosts || mappedPosts.length === 0) && (
              <div className="col-span-full text-center text-muted-foreground mt-8">
                  <p>No published posts found.</p>
              </div>
          )}
        </div>
      </section>
    </div>
  );
}
