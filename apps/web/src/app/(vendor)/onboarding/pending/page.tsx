import { redirect } from 'next/navigation';
import { createApiClient } from '@khan-familia/sdk';
import { auth } from '@clerk/nextjs/server';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@khan-familia/ui';

const getApiClient = async () => {
  const { getToken } = await auth();
  return createApiClient({
    baseUrl: process.env['NEXT_PUBLIC_API_BASE_URL'] || 'http://localhost:3001',
    getToken: async () => await getToken(),
  });
};

export default async function OnboardingPendingPage() {
  const apiClient = await getApiClient();
  let applicationData: {
    status: string;
    id: string;
    createdAt: string;
    adminNotes?: string;
  } | null = null;

  try {
    const res = await apiClient.getMyApplicationStatus();
    applicationData = res.application as {
      status: string;
      id: string;
      createdAt: string;
      adminNotes?: string;
    };
  } catch (error: unknown) {
    // If no application exists, they shouldn't be on the pending page
    if (error instanceof Error && error.message?.includes('404')) {
      redirect('/onboarding/apply');
    }
    console.error('Error fetching application status:', error);
  }

  if (!applicationData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p>Loading application status...</p>
      </div>
    );
  }

  const status = applicationData.status;

  return (
    <div className="container max-w-2xl py-24 mx-auto px-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 md:p-12 text-center">
        {status === 'PENDING' && (
          <>
            <div className="mx-auto w-24 h-24 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-6">
              <Clock className="w-12 h-12 text-amber-600 dark:text-amber-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-4">
              Application Under Review
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
              Thank you for applying to be a vendor on Khan Familia! Our team is currently reviewing
              your application and verifying your documents. We will notify you once a decision has
              been made.
            </p>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 inline-block text-left w-full max-w-sm mx-auto border border-slate-100 dark:border-slate-800">
              <div className="text-sm text-slate-500 mb-1">Application ID</div>
              <div className="font-mono text-slate-900 dark:text-slate-200">
                {applicationData.id}
              </div>
              <div className="text-sm text-slate-500 mt-3 mb-1">Submitted On</div>
              <div className="text-slate-900 dark:text-slate-200">
                {new Date(applicationData.createdAt).toLocaleDateString()}
              </div>
            </div>
          </>
        )}

        {status === 'APPROVED' && (
          <>
            <div className="mx-auto w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-4">
              Application Approved!
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
              Congratulations! Your vendor account has been approved. You can now access your vendor
              dashboard to start listing properties and experiences.
            </p>
            {/* We will route this to actual tenant dashboard later */}
            <Button asChild size="lg">
              <Link href="/">Go to Homepage</Link>
            </Button>
          </>
        )}

        {status === 'REJECTED' && (
          <>
            <div className="mx-auto w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
              <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-4">
              Application Rejected
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
              Unfortunately, we could not approve your application at this time.
            </p>
            {applicationData.adminNotes && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-4 text-left max-w-md mx-auto mb-8">
                <span className="font-semibold text-red-800 dark:text-red-200">Reason:</span>
                <p className="text-red-700 dark:text-red-300 mt-1">{applicationData.adminNotes}</p>
              </div>
            )}
            <p className="text-slate-500 text-sm">
              If you believe this was a mistake, please contact support.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
