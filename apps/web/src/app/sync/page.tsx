import { redirect } from 'next/navigation';
import { getServerApiClient } from '@/lib/api.server';
import { Skeleton } from '@khan-familia/ui';

export const dynamic = 'force-dynamic';

export default async function SyncPage() {
  try {
    const api = await getServerApiClient();
    const me = await api.getMe();

    if (me.role === 'SUPER_ADMIN') {
      redirect('/admin');
    }

    if (me.defaultTenantId) {
      redirect('/host');
    }

    redirect('/account');
  } catch (error) {
    console.error('Failed to sync user profile:', error);
    // If getting the profile fails (e.g. not created yet or network issue), fallback safely
    redirect('/');
  }

  return (
    <div className="flex h-[50vh] w-full items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    </div>
  );
}
