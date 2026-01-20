import Stripe from 'stripe';

export const getStripe = () => {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY environment variable.');
  }
  return new Stripe(stripeSecretKey, {
    apiVersion: '2024-06-20',
  });
};
