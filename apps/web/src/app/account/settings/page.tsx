import { UserProfile } from '@clerk/nextjs';

export const metadata = {
  title: 'Settings - Khan Familia',
};

export default function SettingsPage() {
  return (
    <div className="flex w-full items-center justify-center pt-8">
      <UserProfile
        appearance={{
          elements: {
            rootBox: 'mx-auto w-full max-w-4xl',
            card: 'shadow-lg border border-border/50 rounded-2xl w-full',
          },
        }}
      />
    </div>
  );
}
