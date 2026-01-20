'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { SubscriptionPlanForm } from './subscription-plan-form';

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

interface SubscriptionPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: SubscriptionPlan | null;
}

export function SubscriptionPlanDialog({ open, onOpenChange, plan }: SubscriptionPlanDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{plan ? 'Edit Subscription Plan' : 'New Subscription Plan'}</DialogTitle>
          <DialogDescription>
            {plan
              ? 'Update the details for this subscription plan.'
              : 'Add a new subscription plan for your readers.'}
          </DialogDescription>
        </DialogHeader>
        <SubscriptionPlanForm plan={plan} onFinished={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
