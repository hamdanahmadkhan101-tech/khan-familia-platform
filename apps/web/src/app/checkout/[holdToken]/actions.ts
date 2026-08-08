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
    Authorization: `Bearer ${token}`,
  };

  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }

  try {
    const res = await api.createPaymentIntent(holdToken, guestDetails, specialNeeds, { headers });
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create payment intent';
    throw new Error(message);
  }
}

export async function verifyHoldStatusAction(holdToken: string) {
  const { getToken } = await auth();
  const token = await getToken();

  if (!token) return { isValid: false };

  try {
    await api.getHoldStatus(holdToken, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    return { isValid: true };
  } catch {
    return { isValid: false };
  }
}
