import { type ReactNode } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerApiClient } from '@/lib/api.server';
import { LayoutDashboard, FileText, Users, Building, Settings, LogOut } from 'lucide-react';
import { SignOutButton } from '@clerk/nextjs';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const apiClient = await getServerApiClient();
  let role = 'USER';

  try {
    const profile = await apiClient.getMe();
    role = profile.role;
  } catch (error) {
    console.error('Failed to authenticate admin user:', error);
    redirect('/sign-in');
  }

  if (role !== 'SUPER_ADMIN') {
    redirect('/');
  }

  return (
    <div className="flex h-screen w-full bg-muted/40">
      {/* Sidebar */}
      <aside className="w-64 flex-col hidden sm:flex border-r bg-background h-full">
        <div className="p-6 border-b flex items-center h-[60px]">
          <h2 className="text-xl font-bold tracking-tight text-primary">KF Admin</h2>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-4 text-sm font-medium">
            <li>
              <Link
                href="/admin"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                href="/admin/applications"
                className="flex items-center gap-3 rounded-lg bg-primary/10 px-3 py-2 text-primary transition-all"
              >
                <FileText className="h-4 w-4" />
                Applications
              </Link>
            </li>
            <li>
              <Link
                href="/admin/tenants"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
              >
                <Building className="h-4 w-4" />
                Tenants
              </Link>
            </li>
            <li>
              <Link
                href="/admin/users"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
              >
                <Users className="h-4 w-4" />
                Users
              </Link>
            </li>
            <li>
              <Link
                href="/admin/settings"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </li>
          </ul>
        </nav>
        <div className="p-4 border-t">
          <SignOutButton>
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-destructive transition-all hover:bg-destructive/10">
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </SignOutButton>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Header (optional placeholder for later) */}
        <header className="h-[60px] flex sm:hidden border-b bg-background items-center px-4">
          <h2 className="text-lg font-bold">KF Admin</h2>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-10">{children}</div>
      </main>
    </div>
  );
}
