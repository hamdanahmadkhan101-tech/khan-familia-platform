'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { api } from '../../../lib/api';

async function getAuthOptions() {
  const { getToken } = await auth();
  const token = await getToken();
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

export async function addPropertyImage(propertyId: string, uploadId: string) {
  const options = await getAuthOptions();
  const image = await api.addPropertyImage(propertyId, uploadId, options);
  revalidatePath('/account/properties');
  return image;
}

export async function getTenantProperties() {
  const options = await getAuthOptions();
  return api.getTenantProperties(options);
}
