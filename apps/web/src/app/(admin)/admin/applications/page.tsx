import { getServerApiClient } from '@/lib/api.server';
import { ApplicationsTable, type ApplicationData } from './_components/applications-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@khan-familia/ui';

export default async function AdminApplicationsPage() {
  const apiClient = await getServerApiClient();
  let pendingApplications: ApplicationData[] = [];

  try {
    const data = await apiClient.getPendingApplications();
    pendingApplications = (data.applications || []) as ApplicationData[];
  } catch (error) {
    console.error('Failed to fetch pending applications:', error);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Vendor Applications
        </h1>
        <p className="text-muted-foreground mt-2">
          Review, approve, and reject new tenant applications.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Review</CardTitle>
          <CardDescription>
            These applications are waiting for your approval. Please verify their details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ApplicationsTable data={pendingApplications} />
        </CardContent>
      </Card>
    </div>
  );
}
