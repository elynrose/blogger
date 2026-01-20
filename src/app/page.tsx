'use client';

import { PostCard } from '@/components/blog/post-card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { BlogPost } from '@/lib/types';
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  Timestamp,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import Link from 'next/link';


// Firestore post structure
interface PostDocument {
  id: string;
  title: string;
  excerpt?: string;
  createdAt: Timestamp;
  publishDate?: Timestamp;
  status: 'draft' | 'published';
  imageUrl?: string;
  authorId: string;
  authorName: string;
  tags?: string[];
  staffPick?: boolean;
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

export default function Home() {
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const searchQuery = (searchParams.get('q') ?? '').trim().toLowerCase();
  const pageSize = 12;

  const [posts, setPosts] = useState<PostDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);
  const { data: categories } = useCollection<{ id: string; name: string }>(categoriesQuery);

  useEffect(() => {
    if (!firestore) return;
    let isCancelled = false;

    const loadInitial = async () => {
      setIsLoading(true);
      const postsQuery = query(
        collection(firestore, 'posts'),
        where('status', '==', 'published'),
        orderBy('publishDate', 'desc'),
        limit(pageSize)
      );
      const snapshot = await getDocs(postsQuery);
      if (isCancelled) return;
      const nextPosts = snapshot.docs.map((docSnap) => ({ ...(docSnap.data() as PostDocument), id: docSnap.id }));
      setPosts(nextPosts);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] ?? null);
      setHasMore(snapshot.docs.length === pageSize);
      setIsLoading(false);
    };

    loadInitial();
    return () => {
      isCancelled = true;
    };
  }, [firestore, pageSize]);

  const staffPicksQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'posts'),
      where('status', '==', 'published'),
      where('staffPick', '==', true),
      orderBy('publishDate', 'desc'),
      limit(6)
    );
  }, [firestore]);

  const { data: staffPicksData } = useCollection<PostDocument>(staffPicksQuery);

  const mappedPosts: BlogPost[] | null = useMemo(() => {
    if (!posts.length) return [];
    const categoryMap = new Map(categories?.map((category) => [category.id, category.name]));
    return posts.map(post => {
      const authorName = post.authorName || 'Polygeno';
      const excerpt = post.excerpt || '';
      const date = post.publishDate ? post.publishDate.toDate() : post.createdAt.toDate();
      const categoryName = post.categoryId ? categoryMap.get(post.categoryId) : undefined;

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
        content: excerpt,
        tags: post.tags ?? [],
        staffPick: !!post.staffPick,
        category: categoryName ?? null,
        categoryId: post.categoryId ?? null,
        subscriptionRequired: !!post.subscriptionRequired,
      };
    });
  }, [posts, categories]);

  const mappedStaffPicks: BlogPost[] | null = useMemo(() => {
    if (!staffPicksData) return null;
    const categoryMap = new Map(categories?.map((category) => [category.id, category.name]));
    return staffPicksData.map((post) => {
      const authorName = post.authorName || 'Polygeno';
      const excerpt = post.excerpt || '';
      const date = post.publishDate ? post.publishDate.toDate() : post.createdAt.toDate();
      const categoryName = post.categoryId ? categoryMap.get(post.categoryId) : undefined;

      return {
        slug: post.id,
        title: post.title,
        excerpt,
        imageUrl: post.imageUrl || 'https://picsum.photos/seed/' + post.id + '/1200/800',
        imageHint: 'technology',
        author: authorName,
        authorImageUrl: 'https://picsum.photos/seed/' + post.authorId + '/100/100',
        authorImageHint: 'person portrait',
        date: date.toISOString(),
        content: excerpt,
        tags: post.tags ?? [],
        staffPick: true,
        category: categoryName ?? null,
        categoryId: post.categoryId ?? null,
        subscriptionRequired: !!post.subscriptionRequired,
      };
    });
  }, [staffPicksData, categories]);

  const filteredPosts = useMemo(() => {
    if (!mappedPosts) return null;
    if (!searchQuery) return mappedPosts;
    return mappedPosts.filter(post => {
      const tags = post.tags?.join(' ') ?? '';
      const haystack = `${post.title} ${post.excerpt} ${post.author} ${tags}`.toLowerCase();
      return haystack.includes(searchQuery);
    });
  }, [mappedPosts, searchQuery]);
  

  const regularPosts = useMemo(() => {
    if (!filteredPosts) return null;
    return filteredPosts.filter(post => !post.staffPick);
  }, [filteredPosts]);

  const handleLoadMore = async () => {
    if (!firestore || !hasMore || !lastDoc || isLoadingMore) return;
    setIsLoadingMore(true);
    const postsQuery = query(
      collection(firestore, 'posts'),
      where('status', '==', 'published'),
      orderBy('publishDate', 'desc'),
      startAfter(lastDoc),
      limit(pageSize)
    );
    const snapshot = await getDocs(postsQuery);
    const nextPosts = snapshot.docs.map((docSnap) => ({ ...(docSnap.data() as PostDocument), id: docSnap.id }));
    setPosts((prev) => [...prev, ...nextPosts]);
    setLastDoc(snapshot.docs[snapshot.docs.length - 1] ?? lastDoc);
    setHasMore(snapshot.docs.length === pageSize);
    setIsLoadingMore(false);
  };

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

      {mappedStaffPicks && mappedStaffPicks.length > 0 && (
        <section className="pb-12">
          <div className="mb-6">
            <h2 className="text-2xl font-headline font-bold text-primary">Staff Picks</h2>
            <p className="text-sm text-muted-foreground">Hand-picked articles from our team.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mappedStaffPicks.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      )}

      <section className="pb-12">
        <Card className="border-foreground/10 bg-muted/30">
          <CardContent className="py-8 flex flex-col items-center text-center gap-4">
            <h2 className="text-2xl font-headline font-bold text-primary">Unlock subscriber-only posts</h2>
            <p className="text-sm text-muted-foreground max-w-xl">
              Subscribe to access premium deep dives, templates, and exclusive tutorials.
            </p>
            <Link href="/subscribe">
              <Button>View Subscription Plans</Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      <section className="pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading && Array.from({ length: 3 }).map((_, i) => (
             <PostCardSkeleton key={i} />
          ))}
          {!isLoading && regularPosts && regularPosts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
          {!isLoading && (!filteredPosts || filteredPosts.length === 0) && (
              <div className="col-span-full text-center text-muted-foreground mt-8">
                  <p>{searchQuery ? 'No matching posts found.' : 'No published posts found.'}</p>
              </div>
          )}
        </div>
        {!searchQuery && hasMore && !isLoading && (
          <div className="mt-10 flex justify-center">
            <Button onClick={handleLoadMore} disabled={isLoadingMore}>
              {isLoadingMore ? 'Loading...' : 'Load more'}
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
