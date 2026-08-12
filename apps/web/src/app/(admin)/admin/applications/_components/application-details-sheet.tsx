'use client';

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@khan-familia/ui';
import type { ApplicationData } from './applications-table';
import { ModerationActions } from './moderation-actions';

interface ApplicationDetailsSheetProps {
  application: ApplicationData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApplicationDetailsSheet({
  application,
  open,
  onOpenChange,
}: ApplicationDetailsSheetProps) {
  if (!application) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl">{application.businessName}</SheetTitle>
          <SheetDescription>
            Submitted on {new Date(application.createdAt).toLocaleDateString()}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Contact Info */}
          <section className="space-y-2">
            <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">
              Contact Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Full Name</p>
                <p className="font-medium">{application.fullName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">
                  {application.user?.email || application.email || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Phone</p>
                <p className="font-medium">{application.phone}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Country</p>
                <p className="font-medium">{application.country}</p>
              </div>
            </div>
          </section>

          <hr className="border-border" />

          {/* Business Info */}
          <section className="space-y-2">
            <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">
              Business Details
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Business Name</p>
                <p className="font-medium">{application.businessName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Vertical</p>
                <p className="font-medium">
                  {application.businessVertical?.replace('_', ' ') || 'N/A'}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">Business Reg Number (Decrypted)</p>
                <p className="font-mono text-xs bg-muted p-2 rounded mt-1 border">
                  {application.businessRegNumber}
                </p>
              </div>
            </div>
          </section>

          <hr className="border-border" />

          {/* Identity Verification */}
          <section className="space-y-2">
            <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">
              Identity Verification
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">ID Type</p>
                <p className="font-medium">{application.govIdType}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">ID Number (Decrypted)</p>
                <p className="font-mono text-xs bg-muted p-2 rounded mt-1 border">
                  {application.govIdNumber}
                </p>
              </div>
            </div>
          </section>

          <hr className="border-border" />

          {/* Documents */}
          <section className="space-y-2">
            <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">
              Submitted Documents
            </h3>
            <div className="space-y-2">
              {application.documents && Array.isArray(application.documents) ? (
                application.documents.map(
                  (doc: { url?: string; [key: string]: unknown }, index: number) => (
                    <a
                      key={index}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 rounded-lg border text-sm text-primary hover:bg-muted transition-colors"
                    >
                      View Document {index + 1}
                    </a>
                  ),
                )
              ) : (
                <p className="text-sm text-muted-foreground">No documents attached.</p>
              )}
            </div>
          </section>

          <div className="pt-6">
            <ModerationActions
              applicationId={application.id}
              currentStatus={application.status}
              onComplete={() => onOpenChange(false)}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
