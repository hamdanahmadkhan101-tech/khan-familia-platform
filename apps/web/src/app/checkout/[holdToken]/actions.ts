'use server';

import { auth } from '@clerk/nextjs/server';
import { api } from '@/lib/api';

export async function createPaymentIntentAction(
  holdToken: string,
  guestDetails?: Record<string, unknown>[],
  specialNeeds?: string[],
  idempotencyKey?: string,
) {
  const { getToken } = await auth();
  const token = await getToken();

  if (!token) {
    throw new Error('Unauthorized');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }

  const res = await fetch(`${api.baseUrl}/payments/intent`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ holdToken, guestDetails, specialNeeds }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to create payment intent');
  }

  return res.json();
}
export async function verifyHoldStatusAction(holdToken: string) {
  const { getToken } = await auth();
  const token = await getToken();

  if (!token) return { isValid: false };

  const res = await fetch(`${api.baseUrl}/bookings/holds/${holdToken}`, {
    headers: { Authorization: `Bearer ${token}` },
    // Cache for a very short time or no-store
    cache: 'no-store',
  });

  if (!res.ok) {
    return { isValid: false };
  }

  return { isValid: true };
}
