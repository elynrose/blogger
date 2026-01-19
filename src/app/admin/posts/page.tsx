'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface Post {
    id: string;
    title: string;
    content: string;
    createdAt: Timestamp;
}

export default function AdminPostsPage() {
    const firestore = useFirestore();

    const postsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'posts'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const { data: posts, isLoading } = useCollection<Post>(postsQuery);

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold font-headline text-primary">Manage Posts</h1>
                <Link href="/admin/posts/new">
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Post
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {isLoading && Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-6 w-3/4" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-5/6" />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Skeleton className="h-4 w-1/2" />
                        </CardFooter>
                    </Card>
                ))}
                
                {!isLoading && posts && posts.map((post) => (
                    <Card key={post.id} className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <p className="text-sm text-muted-foreground line-clamp-3">
                                {post.content}
                            </p>
                        </CardContent>
                        <CardFooter className="mt-auto pt-4">
                            <p className="text-xs text-muted-foreground">
                                {post.createdAt ? format(post.createdAt.toDate(), 'MMM d, yyyy') : 'Date unavailable'}
                            </p>
                        </CardFooter>
                    </Card>
                ))}

                {!isLoading && (!posts || posts.length === 0) && (
                    <div className="col-span-full text-center text-muted-foreground mt-8">
                        <p>No posts found. Start by creating a new post!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
