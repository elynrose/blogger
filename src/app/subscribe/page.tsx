'use client';

import { useMemo, useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  priceId: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  active: boolean;
}

const formatPrice = (plan: SubscriptionPlan) => {
  const amount = typeof plan.price === 'number' ? plan.price / 100 : 0;
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: (plan.currency || 'usd').toUpperCase(),
    maximumFractionDigits: 2,
  });
  return `${formatter.format(amount)} / ${plan.interval}`;
};

export default function SubscribePage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

  const plansQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'subscription_plans'), where('active', '==', true));
  }, [firestore]);

  const { data: plans, isLoading } = useCollection<SubscriptionPlan>(plansQuery);

  const sortedPlans = useMemo(() => {
    if (!plans) return [];
    return [...plans].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
  }, [plans]);

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      setLoadingPlanId(plan.id);
      const token = await user.getIdToken();
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ priceId: plan.priceId }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to start checkout.');
      }

      if (payload?.url) {
        window.location.href = payload.url;
      }
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Unable to start checkout',
        description: error?.message || 'Please try again.',
      });
    } finally {
      setLoadingPlanId(null);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-headline font-bold text-primary">Subscribe</h1>
        <p className="mt-3 text-muted-foreground">
          Unlock subscriber-only posts, templates, and exclusive tutorials.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}

        {!isLoading &&
          sortedPlans.map((plan) => (
            <Card key={plan.id} className="border-foreground/10">
              <CardHeader>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-2xl font-bold text-primary">{formatPrice(plan)}</p>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => handleSubscribe(plan)}
                  disabled={loadingPlanId === plan.id}
                >
                  {loadingPlanId === plan.id ? 'Redirecting...' : 'Subscribe'}
                </Button>
              </CardFooter>
            </Card>
          ))}
      </div>

      {!isLoading && sortedPlans.length === 0 && (
        <div className="text-center text-muted-foreground mt-10">
          No active subscription plans are available yet.
        </div>
      )}
    </div>
  );
}
