import { Card, CardContent, CardHeader, CardTitle } from '@khan-familia/ui';
import { getServerApiClient } from '@/lib/api.server';
import { Users, FileText, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@khan-familia/ui';

export default async function AdminDashboardPage() {
  const apiClient = await getServerApiClient();

  // We can fetch pending applications just to get a count
  let pendingCount = 0;
  try {
    const { applications } = await apiClient.getPendingApplications();
    pendingCount = applications?.length || 0;
  } catch (error) {
    console.error('Failed to fetch pending applications count:', error);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Super Admin Console
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage the Khan Familia platform, review applications, and monitor metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Applications</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Requires your review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground mt-1">Active platform tenants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Properties</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground mt-1">Approved properties online</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground mt-1">Registered customers</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Vendor Moderation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You have {pendingCount} new vendor applications waiting for review. Please verify
              their government IDs and business registrations before approving.
            </p>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/admin/applications">Review Applications</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
