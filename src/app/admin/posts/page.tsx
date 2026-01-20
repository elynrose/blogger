'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button, buttonVariants } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { useCollection, useFirestore, useIsAdmin, useMemoFirebase, deleteDocumentNonBlocking, useUserRole, useUser } from '@/firebase';
import { collection, query, orderBy, Timestamp, doc, where } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Post {
    id: string;
    title: string;
    excerpt?: string;
    createdAt: Timestamp;
    publishDate?: Timestamp;
    status: 'draft' | 'published';
    imageUrl?: string;
}

interface PostViewStats {
    id: string;
    totalViews?: number;
    uniqueViews?: number;
}

export default function AdminPostsPage() {
    const firestore = useFirestore();
    const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();
    const { role, isLoading: isRoleLoading } = useUserRole();
    const { user } = useUser();
    const { toast } = useToast();
    const router = useRouter();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [postToDelete, setPostToDelete] = useState<Post | null>(null);

    const canManageAll = isAdmin || role === 'editor';
    const canWrite = canManageAll || role === 'writer';

    const postsQuery = useMemoFirebase(() => {
        if (!firestore || !canWrite) return null;
        if (!canManageAll && user) {
            return query(
                collection(firestore, 'posts'),
                where('authorId', '==', user.uid),
                orderBy('createdAt', 'desc')
            );
        }
        return query(collection(firestore, 'posts'), orderBy('createdAt', 'desc'));
    }, [firestore, canWrite, canManageAll, user]);

    const { data: posts, isLoading: isPostsLoading } = useCollection<Post>(postsQuery);
    const viewStatsQuery = useMemoFirebase(() => {
        if (!firestore || !canManageAll) return null;
        return collection(firestore, 'post_views');
    }, [firestore, canManageAll]);
    const { data: viewStats } = useCollection<PostViewStats>(viewStatsQuery);
    const isLoading = isAdminLoading || isRoleLoading || isPostsLoading;

    const viewStatsMap = new Map<string, PostViewStats>();
    viewStats?.forEach((stat) => viewStatsMap.set(stat.id, stat));

    if (!isAdminLoading && !isRoleLoading && !canWrite) {
        return null;
    }

    const handleDelete = () => {
        if (!postToDelete || !firestore) return;
        const postRef = doc(firestore, 'posts', postToDelete.id);
        
        deleteDocumentNonBlocking(postRef);
        toast({ title: 'Post deletion initiated.' });

        setShowDeleteDialog(false);
        setPostToDelete(null);
    };

    const getStatusVariant = (status: 'draft' | 'published') => {
        if (status === 'published') return 'default';
        return 'secondary';
    }

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
                    <Card
                        key={post.id}
                        className="flex flex-col overflow-hidden cursor-pointer transition-shadow hover:shadow-lg"
                        onClick={() => router.push(`/admin/posts/${post.id}`)}
                    >
                        {post.imageUrl && (
                            <div className="relative h-40 w-full">
                                <Image
                                    src={post.imageUrl}
                                    alt={post.title}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        )}
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle className="line-clamp-2 pr-2">{post.title}</CardTitle>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            className="h-8 w-8 p-0"
                                            onClick={(event) => event.stopPropagation()}
                                        >
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
                                        <DropdownMenuItem asChild>
                                            <Link
                                                href={`/admin/posts/${post.id}/edit`}
                                                className="flex items-center cursor-pointer"
                                            >
                                                <Edit className="mr-2 h-4 w-4" />
                                                <span>Edit</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        {canManageAll && (
                                            <>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive focus:bg-destructive/10 flex items-center cursor-pointer"
                                                    onClick={() => {
                                                        setPostToDelete(post);
                                                        setShowDeleteDialog(true);
                                                    }}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    <span>Delete</span>
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div className='mt-2'>
                                <Badge variant={getStatusVariant(post.status)}>{post.status}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <p className="text-sm text-muted-foreground line-clamp-3">
                                {post.excerpt || 'No excerpt yet.'}
                            </p>
                        </CardContent>
                        <CardFooter className="mt-auto pt-4 text-xs text-muted-foreground flex flex-col items-start gap-1">
                            {post.status === 'published' && post.publishDate ? (
                                <p>Published on {format(post.publishDate.toDate(), 'MMM d, yyyy')}</p>
                            ) : (
                                <p>Created on {post.createdAt ? format(post.createdAt.toDate(), 'MMM d, yyyy') : 'Date unavailable'}</p>
                            )}
                            <p>
                                Views: {viewStatsMap.get(post.id)?.totalViews ?? 0} · Unique: {viewStatsMap.get(post.id)?.uniqueViews ?? 0}
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

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the post &quot;{postToDelete?.title}&quot;.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: 'destructive' })}>
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
