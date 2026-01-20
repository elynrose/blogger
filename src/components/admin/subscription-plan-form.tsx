'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader } from 'lucide-react';

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

interface SubscriptionPlanFormProps {
  plan: SubscriptionPlan | null;
  onFinished: () => void;
}

export function SubscriptionPlanForm({ plan, onFinished }: SubscriptionPlanFormProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceId, setPriceId] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('usd');
  const [interval, setInterval] = useState<'month' | 'year'>('month');
  const [active, setActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (plan) {
      setName(plan.name);
      setDescription(plan.description);
      setPriceId(plan.priceId);
      setPrice(plan.price ? (plan.price / 100).toFixed(2) : '');
      setCurrency(plan.currency || 'usd');
      setInterval(plan.interval || 'month');
      setActive(plan.active ?? true);
    } else {
      setName('');
      setDescription('');
      setPriceId('');
      setPrice('');
      setCurrency('usd');
      setInterval('month');
      setActive(true);
    }
  }, [plan]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!firestore || !name || !priceId || !price) {
      toast({ variant: 'destructive', title: 'Name, Price, and Stripe Price ID are required.' });
      return;
    }

    const parsedPrice = Number(price);
    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      toast({ variant: 'destructive', title: 'Price must be a valid number.' });
      return;
    }

    setIsSaving(true);
    const priceInCents = Math.round(parsedPrice * 100);
    const payload = {
      name,
      description,
      priceId,
      price: priceInCents,
      currency,
      interval,
      active,
      updatedAt: serverTimestamp(),
    };

    if (plan) {
      const planRef = doc(firestore, 'subscription_plans', plan.id);
      updateDocumentNonBlocking(planRef, payload);
      toast({ title: 'Subscription plan updated!' });
    } else {
      const plansCollection = collection(firestore, 'subscription_plans');
      addDocumentNonBlocking(plansCollection, {
        ...payload,
        createdAt: serverTimestamp(),
      });
      toast({ title: 'Subscription plan created!' });
    }

    onFinished();
    setIsSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="plan-name" className="text-right">
          Name
        </Label>
        <Input id="plan-name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="plan-description" className="text-right">
          Description
        </Label>
        <Textarea
          id="plan-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="col-span-3"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="plan-price" className="text-right">
          Price (USD)
        </Label>
        <Input
          id="plan-price"
          type="number"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="col-span-3"
          required
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="plan-interval" className="text-right">
          Interval
        </Label>
        <div className="col-span-3">
          <Select value={interval} onValueChange={(value: 'month' | 'year') => setInterval(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select interval" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Monthly</SelectItem>
              <SelectItem value="year">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="plan-currency" className="text-right">
          Currency
        </Label>
        <Input
          id="plan-currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value.toLowerCase())}
          className="col-span-3"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="plan-price-id" className="text-right">
          Stripe Price ID
        </Label>
        <Input
          id="plan-price-id"
          value={priceId}
          onChange={(e) => setPriceId(e.target.value)}
          className="col-span-3"
          required
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="plan-active" className="text-right">
          Active
        </Label>
        <div className="col-span-3">
          <Switch id="plan-active" checked={active} onCheckedChange={setActive} />
        </div>
      </div>
      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isSaving}>
          {isSaving && <Loader className="mr-2 h-4 w-4 animate-spin" />}
          {plan ? 'Save Changes' : 'Create Plan'}
        </Button>
      </div>
    </form>
  );
}
