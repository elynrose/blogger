'use client';

import { useEffect, useMemo, useState } from 'react';
import { useIsAdmin, useUser } from '@/firebase';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface Comment {
  id: string;
  postId?: string;
  postTitle?: string;
  userId: string;
  userName: string;
  body: string;
  status?: string;
  createdAt?: string | null;
}

function AdminCommentsTable() {
  const { user } = useUser();
  const { toast } = useToast();
  const [commentToDelete, setCommentToDelete] = useState<Comment | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    const loadComments = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/admin/comments', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to load comments');
        }
        if (!isCancelled) {
          setComments(payload.comments || []);
        }
      } catch (error: any) {
        if (!isCancelled) {
          toast({ variant: 'destructive', title: 'Failed to load comments', description: error?.message });
          setComments([]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadComments();
    return () => {
      isCancelled = true;
    };
  }, [user, toast]);

  const handleApprove = async (comment: Comment) => {
    if (!user || !comment.postId || !comment.id) return;
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/comments', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId: comment.postId, commentId: comment.id, status: 'approved' }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to approve comment');
      }
      setComments((prev) =>
        prev.map((item) => (item.id === comment.id ? { ...item, status: 'approved' } : item))
      );
      toast({ title: 'Comment approved.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to approve comment', description: error?.message });
    }
  };

  const handleDelete = async () => {
    if (!user || !commentToDelete?.postId || !commentToDelete.id) return;
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/comments', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId: commentToDelete.postId, commentId: commentToDelete.id }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to delete comment');
      }
      setComments((prev) => prev.filter((comment) => comment.id !== commentToDelete.id));
      toast({ title: 'Comment deleted.' });
      setCommentToDelete(null);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to delete comment', description: error?.message });
    }
  };

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Post</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-[80px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-64" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell />
                </TableRow>
              ))}
              {!isLoading && comments.map((comment) => (
                  <TableRow key={comment.id}>
                  <TableCell className="font-medium">{comment.postTitle || 'Unknown post'}</TableCell>
                  <TableCell>{comment.userName}</TableCell>
                  <TableCell className="max-w-[320px] truncate">{comment.body}</TableCell>
                    <TableCell className="text-xs uppercase">{comment.status || 'pending'}</TableCell>
                  <TableCell>
                    {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApprove(comment)}
                          disabled={!comment.postId || comment.status === 'approved'}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCommentToDelete(comment)}
                          disabled={!comment.postId}
                        >
                          Delete
                        </Button>
                      </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {!isLoading && (!comments || comments.length === 0) && (
        <div className="text-center text-muted-foreground mt-8">
          <p>No comments yet.</p>
        </div>
      )}

      <AlertDialog open={!!commentToDelete} onOpenChange={(open) => !open && setCommentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this comment?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className={buttonVariants({ variant: 'destructive' })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function AdminCommentsPage() {
  const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();

  if (isAdminLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold font-headline text-primary">Moderate Comments</h1>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Post</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[80px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-64" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell />
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold font-headline text-primary">Moderate Comments</h1>
      </div>
      <AdminCommentsTable />
    </div>
  );
}
