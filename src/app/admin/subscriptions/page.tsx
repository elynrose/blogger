'use client';

import { useState } from 'react';
import { useCollection, useFirestore, useIsAdmin, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { SubscriptionPlanDialog } from '@/components/admin/subscription-plan-dialog';
import { DeleteSubscriptionPlanDialog } from '@/components/admin/delete-subscription-plan-dialog';

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

export default function AdminSubscriptionsPage() {
  const firestore = useFirestore();
  const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();

  const plansQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return query(collection(firestore, 'subscription_plans'), orderBy('name'));
  }, [firestore, isAdmin]);

  const { data: plans, isLoading: isPlansLoading } = useCollection<SubscriptionPlan>(plansQuery);
  const isLoading = isAdminLoading || isPlansLoading;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  if (isAdminLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold font-headline text-primary">Manage Subscriptions</h1>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Stripe Price ID</TableHead>
                  <TableHead className="w-[50px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell />
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const handleEdit = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setDialogOpen(true);
  };

  const handleDelete = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold font-headline text-primary">Manage Subscriptions</h1>
        <Button onClick={() => { setSelectedPlan(null); setDialogOpen(true); }}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Plan
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Stripe Price ID</TableHead>
                <TableHead className="w-[50px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                  <TableCell />
                </TableRow>
              ))}
              {!isLoading && plans?.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell>{formatPrice(plan)}</TableCell>
                  <TableCell>{plan.active ? 'Active' : 'Inactive'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{plan.priceId}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(plan)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(plan)} className="text-destructive">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {!isLoading && (!plans || plans.length === 0) && (
        <div className="text-center text-muted-foreground mt-8">
          <p>No subscription plans found. Create your first plan to get started.</p>
        </div>
      )}

      <SubscriptionPlanDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        plan={selectedPlan}
      />
      <DeleteSubscriptionPlanDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        plan={selectedPlan}
      />
    </div>
  );
}
