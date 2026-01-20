'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase';

export default function SubscribeSuccessPage() {
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;
    user.getIdToken(true).catch(() => null);
  }, [user]);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <h1 className="text-4xl font-headline font-bold text-primary">Subscription successful</h1>
      <p className="mt-4 text-muted-foreground">
        Thanks for subscribing! You now have access to subscriber-only posts.
      </p>
      <div className="mt-6">
        <Link href="/">
          <Button>Go back home</Button>
        </Link>
      </div>
    </div>
  );
}
