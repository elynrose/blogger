'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { UserForm, type UserProfile } from './user-form';

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile | null;
}

export function UserDialog({ open, onOpenChange, user }: UserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{user ? 'Edit User' : 'New User Profile'}</DialogTitle>
          <DialogDescription>
            {user
              ? 'Update profile details for this user.'
              : 'Create a profile document for an existing auth user.'}
          </DialogDescription>
        </DialogHeader>
        <UserForm user={user} onFinished={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
