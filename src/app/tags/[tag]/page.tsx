'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { collection, orderBy, query, Timestamp, where } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { PostCard } from '@/components/blog/post-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import type { BlogPost } from '@/lib/types';

interface PostDocument {
  id: string;
  title: string;
  slug?: string;
  excerpt?: string;
  createdAt: Timestamp;
  publishDate?: Timestamp;
  status: 'draft' | 'published';
  imageUrl?: string;
  authorId: string;
  authorName: string;
  authorPhotoUrl?: string;
  tags?: string[];
  categoryId?: string;
  subscriptionRequired?: boolean;
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

export default function TagPostsPage() {
  const { tag } = useParams();
  const tagName = Array.isArray(tag) ? tag[0] : tag;
  const decodedTag = tagName ? decodeURIComponent(tagName) : '';
  const firestore = useFirestore();

  const postsQuery = useMemoFirebase(() => {
    if (!firestore || !decodedTag) return null;
    return query(
      collection(firestore, 'posts'),
      where('status', '==', 'published'),
      where('tags', 'array-contains', decodedTag),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, decodedTag]);

  const { data: posts, isLoading } = useCollection<PostDocument>(postsQuery);

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);
  const { data: categories } = useCollection<{ id: string; name: string }>(categoriesQuery);

  const mappedPosts: BlogPost[] | null = useMemo(() => {
    if (!posts) return null;
    const categoryMap = new Map(categories?.map((category) => [category.id, category.name]));
    return posts.map(post => {
      const authorName = post.authorName || 'Polygeno';
      const excerpt = post.excerpt || '';
      const date = post.publishDate ? post.publishDate.toDate() : post.createdAt.toDate();
      const categoryName = post.categoryId ? categoryMap.get(post.categoryId) : undefined;
      const slugValue = post.slug || post.id;

      return {
        slug: slugValue,
        title: post.title,
        excerpt,
        imageUrl: post.imageUrl || 'https://picsum.photos/seed/' + post.id + '/1200/800',
        imageHint: 'technology',
        author: authorName,
        authorImageUrl: post.authorPhotoUrl || 'https://picsum.photos/seed/' + post.authorId + '/100/100',
        authorImageHint: 'person portrait',
        date: date.toISOString(),
        content: excerpt,
        tags: post.tags ?? [],
        staffPick: !!post.staffPick,
        category: categoryName ?? null,
        categoryId: post.categoryId ?? null,
        subscriptionRequired: !!post.subscriptionRequired,
      };
    });
  }, [posts, categories]);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <section className="text-center py-16 sm:py-24">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-headline font-bold tracking-tight text-primary">
          Tag: {decodedTag || 'All'}
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          Articles tagged with {decodedTag}.
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
              <p>No posts found for this tag.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
