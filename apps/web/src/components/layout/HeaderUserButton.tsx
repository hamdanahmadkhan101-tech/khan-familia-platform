'use client';

import { UserButton } from '@clerk/nextjs';
import { LayoutDashboard } from 'lucide-react';

export function HeaderUserButton() {
  return (
    <UserButton
      appearance={{
        elements: {
          avatarBox: 'h-9 w-9 rounded-full border border-border shadow-sm',
        },
      }}
    >
      <UserButton.MenuItems>
        <UserButton.Link
          label="Guest Dashboard"
          labelIcon={<LayoutDashboard className="h-4 w-4" />}
          href="/account"
        />
      </UserButton.MenuItems>
    </UserButton>
  );
}
