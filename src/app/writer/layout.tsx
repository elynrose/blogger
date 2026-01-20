'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Loader } from 'lucide-react';
import { useUser, useUserRole } from '@/firebase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { SignOutButton } from '@/components/auth/sign-out-button';

export default function WriterLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const { role, isLoading: isRoleLoading } = useUserRole();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  const canAccessWriterArea = role === 'writer' || role === 'editor';
  const isLoading = isUserLoading || isRoleLoading;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader className="h-8 w-8 animate-spin" />
        <p className="ml-4 text-muted-foreground">Verifying permissions...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Redirecting to login...</p>
      </div>
    );
  }

  if (!canAccessWriterArea) {
    return (
      <div className="container mx-auto flex h-full items-center justify-center py-24">
        <Card className="w-full max-w-lg">
          <CardHeader className="items-center text-center">
            <ShieldAlert className="h-12 w-12 text-destructive" />
            <CardTitle className="text-2xl">Access Denied</CardTitle>
            <CardDescription>
              Your account does not have access to the writer area.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-center space-y-4">
            <p>
              Ask an admin to grant you <strong>writer</strong> or <strong>editor</strong> access.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <SignOutButton />
          </CardFooter>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
