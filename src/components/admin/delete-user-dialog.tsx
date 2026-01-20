'use client';

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
import { buttonVariants } from '@/components/ui/button';
import { useFirestore, deleteDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from './user-form';

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile | null;
}

export function DeleteUserDialog({ open, onOpenChange, user }: DeleteUserDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleDelete = () => {
    if (!user || !firestore) return;
    const userRef = doc(firestore, 'users', user.id);
    deleteDocumentNonBlocking(userRef);
    toast({ title: 'User profile deleted.' });
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the profile for{' '}
            <strong>{user?.email || user?.id}</strong>.
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
  );
}
