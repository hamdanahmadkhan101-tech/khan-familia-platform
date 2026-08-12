import { redirect } from 'next/navigation';
import { OnboardingWizard } from './_components/onboarding-wizard';
import { createApiClient } from '@khan-familia/sdk';
import { auth } from '@clerk/nextjs/server';

const getApiClient = async () => {
  const { getToken } = await auth();
  return createApiClient({
    baseUrl: process.env['NEXT_PUBLIC_API_BASE_URL'] || 'http://localhost:3001',
    getToken: async () => await getToken(),
  });
};

export default async function OnboardingApplyPage() {
  const apiClient = await getApiClient();

  let hasApplication = false;

  try {
    const statusRes = await apiClient.getMyApplicationStatus();
    if (statusRes.application) {
      hasApplication = true;
    }
  } catch (error: unknown) {
    // If it's a 404, it means no application exists, which is exactly what we want.
    if (error instanceof Error && !error.message?.includes('404')) {
      console.error('Error fetching application status:', error);
      // We could render an error state here, but for now we'll let them try to apply.
    }
  }

  // If we have any status, it means they already applied. Redirect to pending/status page.
  if (hasApplication) {
    redirect('/onboarding/pending');
  }

  return (
    <div className="container max-w-4xl py-12 mx-auto px-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 mb-2">
          Become a Vendor
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Join Khan Familia and start hosting properties or experiences.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 md:p-10">
        <OnboardingWizard />
      </div>
    </div>
  );
}
