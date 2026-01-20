'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import {
  collection,
  doc,
  orderBy,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';
import {
  useCollection,
  useFirestore,
  useMemoFirebase,
  deleteDocumentNonBlocking,
  useUser,
  useUserRole,
} from '@/firebase';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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

export default function WriterPostsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { role, isLoading: isRoleLoading } = useUserRole();
  const { toast } = useToast();
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);

  const canManageAll = role === 'editor' || role === 'admin';
  const canWrite = canManageAll || role === 'writer';

  const postsQuery = useMemoFirebase(() => {
    if (!firestore || !canWrite) return null;
    if (canManageAll) {
      return query(collection(firestore, 'posts'), orderBy('createdAt', 'desc'));
    }
    if (!user) return null;
    return query(
      collection(firestore, 'posts'),
      where('authorId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user, canWrite, canManageAll]);

  const { data: posts, isLoading: isPostsLoading } = useCollection<Post>(postsQuery);

  const viewStatsQuery = useMemoFirebase(() => {
    if (!firestore || !canManageAll) return null;
    return collection(firestore, 'post_views');
  }, [firestore, canManageAll]);

  const { data: viewStats } = useCollection<PostViewStats>(viewStatsQuery);
  const isLoading = isRoleLoading || isPostsLoading;

  const viewStatsMap = new Map<string, PostViewStats>();
  viewStats?.forEach((stat) => viewStatsMap.set(stat.id, stat));

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
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">My Posts</h1>
          <p className="text-sm text-muted-foreground">Manage your drafts and published posts.</p>
        </div>
        <Link href="/writer/posts/new">
          <Button>New Post</Button>
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
            onClick={() => router.push(`/writer/posts/${post.id}`)}
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
                        href={`/writer/posts/${post.id}/edit`}
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
              <div className="mt-2">
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
              {canManageAll && (
                <p>
                  Views: {viewStatsMap.get(post.id)?.totalViews ?? 0} · Unique: {viewStatsMap.get(post.id)?.uniqueViews ?? 0}
                </p>
              )}
            </CardFooter>
          </Card>
        ))}

        {!isLoading && (!posts || posts.length === 0) && (
          <div className="col-span-full text-center text-muted-foreground mt-8">
            <p>No posts yet. Start by creating your first post.</p>
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
