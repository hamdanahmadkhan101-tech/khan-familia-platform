'use client';

import { UserButton, useAuth } from '@clerk/nextjs';
import { LayoutDashboard, Shield, Store } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useApiClient } from '@/hooks/useApiClient';

export function HeaderUserButton() {
  const { isSignedIn } = useAuth();
  const apiClient = useApiClient();

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => apiClient.getMe(),
    enabled: !!isSignedIn,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  // Simplified check: if they have a default tenant, assume they are a host
  const isTenantOwner = user?.defaultTenantId != null;
  return (
    <UserButton
      appearance={{
        elements: {
          avatarBox: 'h-9 w-9 rounded-full border border-border shadow-sm',
        },
      }}
    >
      <UserButton.MenuItems>
        {isSuperAdmin ? (
          <UserButton.Link
            label="Admin Console"
            labelIcon={<Shield className="h-4 w-4" />}
            href="/admin"
          />
        ) : isTenantOwner ? (
          <UserButton.Link
            label="Host Dashboard"
            labelIcon={<Store className="h-4 w-4" />}
            href="/host"
          />
        ) : (
          <UserButton.Link
            label="Guest Dashboard"
            labelIcon={<LayoutDashboard className="h-4 w-4" />}
            href="/account"
          />
        )}
      </UserButton.MenuItems>
    </UserButton>
  );
}
