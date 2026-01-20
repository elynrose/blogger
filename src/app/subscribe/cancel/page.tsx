'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function SubscribeCancelPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <h1 className="text-4xl font-headline font-bold text-primary">Subscription canceled</h1>
      <p className="mt-4 text-muted-foreground">
        Your checkout was canceled. You can try again anytime.
      </p>
      <div className="mt-6">
        <Link href="/subscribe">
          <Button>Back to plans</Button>
        </Link>
      </div>
    </div>
  );
}
