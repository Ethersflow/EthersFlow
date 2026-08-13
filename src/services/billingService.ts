import { loadStripe } from '@stripe/stripe-js';

const getClientStripePromise = () => {
  const rawPublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";
  let publishableKey = rawPublishableKey.trim();
  if ((publishableKey.startsWith('"') && publishableKey.endsWith('"')) || (publishableKey.startsWith("'") && publishableKey.endsWith("'"))) {
    publishableKey = publishableKey.slice(1, -1).trim();
  }
  return publishableKey ? loadStripe(publishableKey) : null;
};

const stripePromise = getClientStripePromise();

export interface UsageInfo {
  plan: string;
  limit: number;
  current: number;
  remaining: number;
  overLimit: boolean;
}

export async function fetchUsage(userId: string): Promise<UsageInfo> {
  try {
    const response = await fetch(`/api/usage/${userId}`);
    if (response.status === 404) {
      // Default to free plan if user not found yet
      return { plan: 'free', limit: 10, current: 0, remaining: 10, overLimit: false };
    }
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      console.error(`Usage fetch failed [${response.status}]:`, errorData);
      throw new Error(`Usage info currently unavailable: ${errorData.error || response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error("fetchUsage network or server error:", error);
    throw error;
  }
}

export async function incrementUsage(userId: string) {
  const response = await fetch('/api/usage/increment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  return response.ok;
}

export async function createCheckoutSession(userId: string, plan: string, interval: 'month' | 'year' = 'month'): Promise<{ url: string }> {
  try {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, plan, interval }),
    });

    if (!response.ok) {
      let errorMessage = `Failed to create checkout session: ${response.statusText}`;
      try {
        const parsed = JSON.parse(await response.clone().text());
        errorMessage = parsed.error || errorMessage;
      } catch (parseErr) {
        const text = await response.text();
        if (text) errorMessage = text;
      }
      throw new Error(errorMessage);
    }

    const session = await response.json();
    if (!session.url) {
      throw new Error("Stripe checkout session URL is missing from server response.");
    }

    return { url: session.url };
  } catch (error) {
    console.error("Stripe Session Error:", error);
    throw error;
  }
}

export async function createPortalSession(userId: string): Promise<{ url: string }> {
  try {
    const response = await fetch('/api/create-portal-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      let errorMessage = `Failed to create portal session: ${response.statusText}`;
      try {
        const parsed = JSON.parse(await response.clone().text());
        errorMessage = parsed.error || errorMessage;
      } catch (parseErr) {
        const text = await response.text();
        if (text) errorMessage = text;
      }
      throw new Error(errorMessage);
    }

    const session = await response.json();
    if (!session.url) {
      throw new Error("Stripe portal session URL is missing from server response.");
    }

    return { url: session.url };
  } catch (error) {
    console.error("Stripe Portal Error:", error);
    throw error;
  }
}
