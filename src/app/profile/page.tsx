'use client';

import { useMemo } from 'react';
import { doc } from 'firebase/firestore';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SignOutButton } from '@/components/auth/sign-out-button';

type UserProfile = {
  id: string;
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
};

export default function ProfilePage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: profile, isLoading } = useDoc<UserProfile>(userRef);

  const displayName = useMemo(() => {
    if (!profile) return '—';
    const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim();
    return fullName || profile.username || profile.email || '—';
  }, [profile]);

  return (
    <div className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold font-headline text-primary">Profile</h1>
        <SignOutButton />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-32" />
            </div>
          )}
          {!isLoading && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{displayName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{profile?.email || user?.email || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Role</span>
                <span className="font-medium capitalize">{profile?.role || 'reader'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">User ID</span>
                <span className="font-mono text-xs">{user?.uid || '—'}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
