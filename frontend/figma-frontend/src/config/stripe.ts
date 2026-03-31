import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with the publishable key from environment variables
const stripeKey = (import.meta as any).env.VITE_STRIPE_PUBLISHABLE_KEY || '';
export const stripePromise = loadStripe(stripeKey);
