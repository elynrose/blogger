'use client';

import { doc } from 'firebase/firestore';
import { useDoc } from './firestore/use-doc';
import { useFirestore, useMemoFirebase, useUser } from './provider';

export type UserRole = 'reader' | 'writer' | 'editor' | 'admin';

export function useUserRole() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading, hasLoaded } = useDoc<{
    role?: UserRole;
  }>(userDocRef, { preventGlobalError: true });

  const role = userProfile?.role ?? 'reader';
  const isLoading = isUserLoading || (user ? !hasLoaded : false) || isProfileLoading;

  return { role, isLoading };
}
