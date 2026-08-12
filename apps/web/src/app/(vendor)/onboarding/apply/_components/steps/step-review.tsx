import { useFormContext } from 'react-hook-form';
import type { SubmitApplicationBody } from '@khan-familia/validation';
import { Card, CardContent } from '@khan-familia/ui';

export function StepReview() {
  const { getValues } = useFormContext<SubmitApplicationBody>();
  const values = getValues();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Review & Submit</h2>
        <p className="text-slate-500">Please review your information before submitting.</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold text-lg mb-4">Personal Info</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-slate-500">Full Name</dt>
                <dd className="font-medium">{values.fullName}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Phone</dt>
                <dd className="font-medium">
                  {values.phoneCountryCode} {values.phone}
                </dd>
              </div>
              {values.altEmail && (
                <div>
                  <dt className="text-slate-500">Alt Email</dt>
                  <dd className="font-medium">{values.altEmail}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold text-lg mb-4">Business & Location</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-slate-500">Business Name</dt>
                <dd className="font-medium">{values.businessName}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Vertical</dt>
                <dd className="font-medium">{values.businessVertical}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-slate-500">Address</dt>
                <dd className="font-medium">
                  {values.businessAddress}, {values.city}, {values.state} {values.postalCode},{' '}
                  {values.country}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold text-lg mb-4">Verification</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-slate-500">Gov ID Type</dt>
                <dd className="font-medium">{values.govIdType}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Gov ID Number</dt>
                <dd className="font-medium">***{values.govIdNumber?.slice(-4)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Business Reg Number</dt>
                <dd className="font-medium">{values.businessRegNumber}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          By submitting this application, you agree to the Terms of Service. Your application will
          be reviewed by an administrator.
        </p>
      </div>
    </div>
  );
}
