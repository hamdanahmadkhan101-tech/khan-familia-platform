'use server';

import { auth } from '@clerk/nextjs/server';
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

export async function addPropertyImage(propertyId: string, url: string, publicId: string) {
  const options = await getAuthOptions();
  return api.addPropertyImage(propertyId, url, publicId, options);
}

export async function getTenantProperties() {
  const options = await getAuthOptions();
  return api.getTenantProperties(options);
}
