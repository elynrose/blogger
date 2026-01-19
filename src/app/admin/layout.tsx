'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader, ShieldAlert } from 'lucide-react';
import { doc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { SignOutButton } from '@/components/auth/sign-out-button';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  // A memoized reference to a document only admins can read.
  const adminCheckDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    // This document doesn't need to exist. We're just checking read access.
    return doc(firestore, 'admin_check', user.uid);
  }, [firestore, user]);

  const { isLoading: isAdminCheckLoading, error: adminCheckError } = useDoc(adminCheckDocRef, { preventGlobalError: true });
  
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    // Determine the final admin checking state.
    // This runs after the initial user loading and the admin check loading completes.
    if (!isUserLoading && !isAdminCheckLoading) {
      setIsCheckingAdmin(false);
    }
  }, [isUserLoading, isAdminCheckLoading]);

  // The user is not an admin if the `useDoc` hook returns a permission error.
  const isPermissionError = adminCheckError && adminCheckError.name === 'FirebaseError';
  const isNotAdmin = !isAdminCheckLoading && isPermissionError;


  if (isUserLoading || isCheckingAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader className="h-8 w-8 animate-spin" />
        <p className="ml-4 text-muted-foreground">Verifying permissions...</p>
      </div>
    );
  }

  if (!user) {
    // This case is handled by the useEffect redirect, but as a fallback:
    return (
        <div className="flex h-screen items-center justify-center">
            <p>Redirecting to login...</p>
        </div>
    );
  }

  if (isNotAdmin) {
    return (
      <div className="container mx-auto flex h-full items-center justify-center py-24">
        <Card className="w-full max-w-lg">
            <CardHeader className="items-center text-center">
                <ShieldAlert className="h-12 w-12 text-destructive" />
                <CardTitle className="text-2xl">Access Denied</CardTitle>
                <CardDescription>
                    Your account does not have administrative privileges.
                </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-center space-y-4">
                <p>
                    To access the admin dashboard, your user account must be granted admin rights in the backend.
                </p>
                <div>
                    <p className="font-semibold">How to get access:</p>
                    <ol className="list-decimal list-inside text-left mt-2 space-y-1 bg-muted p-4 rounded-md">
                        <li>Log into your Firebase Console.</li>
                        <li>Navigate to the <strong>Firestore Database</strong> section.</li>
                        <li>Create a collection named <strong>`roles_admin`</strong>.</li>
                        <li>
                            Add a new document to this collection. The Document ID must be your User ID (UID).
                        </li>
                        <li>Your UID is: <code className="font-mono bg-primary/10 text-primary p-1 rounded text-xs">{user.uid}</code></li>
                    </ol>
                </div>
                 <p>
                    After adding the document, please sign out and sign back in for the changes to take effect.
                </p>
            </CardContent>
            <CardFooter className="flex justify-center">
                <SignOutButton />
            </CardFooter>
        </Card>
      </div>
    );
  }

  // If user is logged in and is an admin, show the admin content.
  return <>{children}</>;
}
