'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import {
  useDoc,
  useFirestore,
  useIsAdmin,
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
  excerpt?: string;
  createdAt: Timestamp;
  publishDate?: Timestamp;
  status: 'draft' | 'published';
  imageUrl?: string;
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

export default function AdminPostDetailPage() {
  const params = useParams();
  const postId = Array.isArray(params.id) ? params.id[0] : params.id;
  const hasPostId = typeof postId === 'string' && postId.length > 0;

  const firestore = useFirestore();
  const router = useRouter();
  const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const { role, isLoading: isRoleLoading } = useUserRole();
  const { user } = useUser();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const canManageAll = isAdmin || role === 'editor';
  const canWrite = canManageAll || role === 'writer';

  const postRef = useMemoFirebase(() => {
    if (!firestore || !canWrite || !hasPostId) return null;
    return doc(firestore, 'posts', postId);
  }, [firestore, canWrite, hasPostId, postId]);

  const viewStatsRef = useMemoFirebase(() => {
    if (!firestore || !canWrite || !hasPostId) return null;
    return doc(firestore, 'post_views', postId);
  }, [firestore, canWrite, hasPostId, postId]);

  const viewIpsQuery = useMemoFirebase(() => {
    if (!firestore || !canWrite || !hasPostId) return null;
    return query(collection(firestore, 'post_views', postId, 'ips'), orderBy('lastSeenAt', 'desc'));
  }, [firestore, canWrite, hasPostId, postId]);

  const { data: post, isLoading: isPostLoading } = useDoc<Post>(postRef);
  const { data: viewStats, isLoading: isStatsLoading } = useDoc<PostViewStats>(viewStatsRef);
  const [viewIps, setViewIps] = useState<ViewIp[]>([]);
  const [isIpsLoading, setIsIpsLoading] = useState(true);
  const [isIpsLoadingMore, setIsIpsLoadingMore] = useState(false);
  const [ipsLastDoc, setIpsLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [ipsHasMore, setIpsHasMore] = useState(true);

  useEffect(() => {
    if (!firestore || !viewIpsQuery) return;
    let isCancelled = false;

    const loadInitial = async () => {
      setIsIpsLoading(true);
      const initialQuery = query(
        collection(firestore, 'post_views', postId, 'ips'),
        orderBy('lastSeenAt', 'desc'),
        limit(25)
      );
      const snapshot = await getDocs(initialQuery);
      if (isCancelled) return;
      const results: ViewIp[] = snapshot.docs.map((docSnap) => ({
        ...(docSnap.data() as ViewIp),
        id: docSnap.id,
      }));
      setViewIps(results);
      setIpsLastDoc(snapshot.docs[snapshot.docs.length - 1] ?? null);
      setIpsHasMore(snapshot.docs.length === 25);
      setIsIpsLoading(false);
    };

    loadInitial();
    return () => {
      isCancelled = true;
    };
  }, [firestore, viewIpsQuery, postId]);

  const isLoading = isAdminLoading || isRoleLoading || isPostLoading || isStatsLoading || isIpsLoading;

  const statusVariant = (status: 'draft' | 'published') =>
    status === 'published' ? 'default' : 'secondary';

  if (!isAdminLoading && !isRoleLoading && !canWrite) {
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
    router.push('/admin/posts');
  };

  const handleLoadMoreIps = async () => {
    if (!firestore || !ipsHasMore || !ipsLastDoc || isIpsLoadingMore) return;
    setIsIpsLoadingMore(true);
    const nextQuery = query(
      collection(firestore, 'post_views', postId, 'ips'),
      orderBy('lastSeenAt', 'desc'),
      startAfter(ipsLastDoc),
      limit(25)
    );
    const snapshot = await getDocs(nextQuery);
    const results: ViewIp[] = snapshot.docs.map((docSnap) => ({
      ...(docSnap.data() as ViewIp),
      id: docSnap.id,
    }));
    setViewIps((prev) => [...prev, ...results]);
    setIpsLastDoc(snapshot.docs[snapshot.docs.length - 1] ?? ipsLastDoc);
    setIpsHasMore(snapshot.docs.length === 25);
    setIsIpsLoadingMore(false);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">Post Overview</h1>
          <p className="text-sm text-muted-foreground">Stats, views, and content controls.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/posts">
            <Button variant="ghost">Back to Posts</Button>
          </Link>
          {post && (
            <Link href={`/admin/posts/${post.id}/edit`}>
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
              <p className="line-clamp-3">{post.excerpt || 'No excerpt yet.'}</p>
            </>
          )}
        </CardContent>
        <CardFooter className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            Total views: {viewStats?.totalViews ?? 0} · Unique views: {viewStats?.uniqueViews ?? 0}
          </div>
          <div>Last updated: {formattedUpdatedAt}</div>
        </CardFooter>
      </Card>

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
        {!isLoading && ipsHasMore && (
          <div className="p-4 flex justify-center">
            <Button onClick={handleLoadMoreIps} disabled={isIpsLoadingMore}>
              {isIpsLoadingMore ? 'Loading...' : 'Load more'}
            </Button>
          </div>
        )}
        {!isLoading && (!viewIps || viewIps.length === 0) && (
          <div className="p-6 text-center text-sm text-muted-foreground">
            No views recorded yet.
          </div>
        )}
      </Card>

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
