'use client';

import { useUser, useIsAdmin } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader, ShieldAlert } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { SignOutButton } from '@/components/auth/sign-out-button';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);


  const canAccessAdmin = isAdmin;


  useEffect(() => {
    if (!isUserLoading && !isAdminLoading && user && !canAccessAdmin) {
      router.replace('/writer');
    }
  }, [canAccessAdmin, isAdminLoading, isUserLoading, router, user]);

  if (isUserLoading || isAdminLoading) {
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

  if (!canAccessAdmin) {
    return (
      <div className="container mx-auto flex h-full items-center justify-center py-24">
        <Card className="w-full max-w-lg">
            <CardHeader className="items-center text-center">
                <ShieldAlert className="h-12 w-12 text-destructive" />
                <CardTitle className="text-2xl">Access Denied</CardTitle>
                <CardDescription>
                    Your account does not have access to the admin area.
                </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-center space-y-4">
                <p>
                    Only administrators can access this area.
                </p>
                <div>
                    <p className="font-semibold">How to get access:</p>
                    <ol className="list-decimal list-inside text-left mt-2 space-y-1 bg-muted p-4 rounded-md">
                        <li>Log into your Firebase Console.</li>
                        <li>Navigate to the <strong>Firestore Database</strong> section.</li>
                        <li>Open the <strong>`users`</strong> collection.</li>
                        <li>Set your user document <strong>`role`</strong> to <strong>`admin`</strong>.</li>
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
