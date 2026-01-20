'use client';

import Link from 'next/link';
import { PenSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SignOutButton } from '@/components/auth/sign-out-button';

export default function WriterDashboard() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold font-headline text-primary">Writer Dashboard</h1>
        <SignOutButton />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PenSquare className="h-6 w-6" />
              My Posts
            </CardTitle>
            <CardDescription>Manage your own articles and drafts.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/writer/posts">
              <Button>Go to My Posts</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
