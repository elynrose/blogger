import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { adminDb, admin, adminAuth } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

const upsertSubscription = async (subscription: Stripe.Subscription, customerId: string) => {
  const usersSnapshot = await adminDb
    .collection('users')
    .where('stripeCustomerId', '==', customerId)
    .limit(1)
    .get();

  if (usersSnapshot.empty) {
    return;
  }

  const userRef = usersSnapshot.docs[0].ref;
  const userId = userRef.id;
  const priceId = subscription.items.data[0]?.price?.id || null;
  const status = subscription.status;
  const isActive = status === 'active' || status === 'trialing';

  await userRef.set(
    {
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: status,
      subscriptionPlanId: priceId,
      subscriptionActive: isActive,
      subscriptionUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      currentPeriodEnd: subscription.current_period_end
        ? admin.firestore.Timestamp.fromMillis(subscription.current_period_end * 1000)
        : null,
    },
    { merge: true }
  );

  await adminAuth.setCustomUserClaims(userId, {
    subscriber: isActive,
  });
};

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Missing webhook secret' }, { status: 500 });
  }

  const stripe = getStripe();

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error('Stripe webhook signature verification failed.', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription' && session.subscription && session.customer) {
          const subscription = await stripe.subscriptions.retrieve(String(session.subscription));
          await upsertSubscription(subscription, String(session.customer));
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        if (subscription.customer) {
          await upsertSubscription(subscription, String(subscription.customer));
        }
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error('Stripe webhook handling failed.', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
