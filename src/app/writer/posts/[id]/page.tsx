'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  collection,
  doc,
  orderBy,
  query,
  Timestamp,
} from 'firebase/firestore';
import {
  useCollection,
  useDoc,
  useFirestore,
  useMemoFirebase,
  deleteDocumentNonBlocking,
  useUserRole,
  useUser,
} from '@/firebase';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

type Post = {
  id: string;
  title: string;
  content: string;
  createdAt: Timestamp;
  publishDate?: Timestamp;
  status: 'draft' | 'published';
  imageUrl?: string;
  authorId: string;
};

type PostViewStats = {
  id: string;
  totalViews?: number;
  uniqueViews?: number;
  updatedAt?: Timestamp;
};

type ViewIp = {
  id: string;
  createdAt?: Timestamp;
  lastSeenAt?: Timestamp;
};

export default function WriterPostDetailPage() {
  const params = useParams();
  const postId = Array.isArray(params.id) ? params.id[0] : params.id;
  const hasPostId = typeof postId === 'string' && postId.length > 0;

  const firestore = useFirestore();
  const router = useRouter();
  const { role, isLoading: isRoleLoading } = useUserRole();
  const { user } = useUser();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const canManageAll = role === 'editor';
  const canWrite = canManageAll || role === 'writer';

  const postRef = useMemoFirebase(() => {
    if (!firestore || !canWrite || !hasPostId) return null;
    return doc(firestore, 'posts', postId);
  }, [firestore, canWrite, hasPostId, postId]);

  const viewStatsRef = useMemoFirebase(() => {
    if (!firestore || !canManageAll || !hasPostId) return null;
    return doc(firestore, 'post_views', postId);
  }, [firestore, canManageAll, hasPostId, postId]);

  const viewIpsQuery = useMemoFirebase(() => {
    if (!firestore || !canManageAll || !hasPostId) return null;
    return query(collection(firestore, 'post_views', postId, 'ips'), orderBy('lastSeenAt', 'desc'));
  }, [firestore, canManageAll, hasPostId, postId]);

  const { data: post, isLoading: isPostLoading } = useDoc<Post>(postRef);
  const { data: viewStats, isLoading: isStatsLoading } = useDoc<PostViewStats>(viewStatsRef);
  const { data: viewIps, isLoading: isIpsLoading } = useCollection<ViewIp>(viewIpsQuery);

  const isLoading = isRoleLoading || isPostLoading || isStatsLoading || isIpsLoading;

  const statusVariant = (status: 'draft' | 'published') =>
    status === 'published' ? 'default' : 'secondary';

  if (!isRoleLoading && !canWrite) {
    return null;
  }

  if (!hasPostId) {
    return null;
  }

  if (role === 'writer' && post && user?.uid !== post.authorId) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            You do not have access to this post.
          </CardContent>
        </Card>
      </div>
    );
  }

  const formattedCreatedAt = post?.createdAt ? format(post.createdAt.toDate(), 'MMM d, yyyy') : '—';
  const formattedPublishDate = post?.publishDate ? format(post.publishDate.toDate(), 'MMM d, yyyy') : '—';
  const formattedUpdatedAt = viewStats?.updatedAt
    ? format(viewStats.updatedAt.toDate(), 'MMM d, yyyy HH:mm')
    : '—';

  const handleDelete = () => {
    if (!firestore || !postId) return;
    const targetRef = doc(firestore, 'posts', postId);
    deleteDocumentNonBlocking(targetRef);
    toast({ title: 'Post deletion initiated.' });
    router.push('/writer/posts');
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">Post Overview</h1>
          <p className="text-sm text-muted-foreground">Stats, views, and content controls.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/writer/posts">
            <Button variant="ghost">Back to My Posts</Button>
          </Link>
          {post && (
            <Link href={`/writer/posts/${post.id}/edit`}>
              <Button>Edit Post</Button>
            </Link>
          )}
          {post && canManageAll && (
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              Delete
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{post?.title || 'Loading post...'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          {isLoading && !post && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-40" />
            </div>
          )}
          {post && (
            <>
              <div className="flex items-center gap-2">
                <Badge variant={statusVariant(post.status)}>{post.status}</Badge>
                <span>Created: {formattedCreatedAt}</span>
                {post.status === 'published' && <span>Published: {formattedPublishDate}</span>}
              </div>
              <p className="line-clamp-3">{post.content}</p>
            </>
          )}
        </CardContent>
        {canManageAll && (
          <CardFooter className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Total views: {viewStats?.totalViews ?? 0} · Unique views: {viewStats?.uniqueViews ?? 0}
            </div>
            <div>Last updated: {formattedUpdatedAt}</div>
          </CardFooter>
        )}
      </Card>

      {canManageAll && (
        <Card>
          <CardHeader>
            <CardTitle>Views by IP (hashed)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP Hash</TableHead>
                  <TableHead>First Seen</TableHead>
                  <TableHead>Last Seen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && Array.from({ length: 4 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  </TableRow>
                ))}
                {!isLoading && viewIps?.map((ip) => (
                  <TableRow key={ip.id}>
                    <TableCell className="font-mono text-xs">{ip.id}</TableCell>
                    <TableCell>
                      {ip.createdAt ? format(ip.createdAt.toDate(), 'MMM d, yyyy') : '—'}
                    </TableCell>
                    <TableCell>
                      {ip.lastSeenAt ? format(ip.lastSeenAt.toDate(), 'MMM d, yyyy HH:mm') : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          {!isLoading && (!viewIps || viewIps.length === 0) && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No views recorded yet.
            </div>
          )}
        </Card>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the post.
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
