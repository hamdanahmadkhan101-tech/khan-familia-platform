'use server';

import { getServerApiClient } from '@/lib/api.server';
import { revalidatePath } from 'next/cache';

export async function approveApplicationAction(applicationId: string, adminNotes: string) {
  const apiClient = await getServerApiClient();
  await apiClient.approveApplication(applicationId, { adminNotes });
  revalidatePath('/admin/applications');
}

export async function rejectApplicationAction(applicationId: string, adminNotes: string) {
  const apiClient = await getServerApiClient();
  await apiClient.rejectApplication(applicationId, { adminNotes });
  revalidatePath('/admin/applications');
}
