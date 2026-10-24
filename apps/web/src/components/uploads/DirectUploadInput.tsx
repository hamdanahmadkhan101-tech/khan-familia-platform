'use client';

import { useId, useState } from 'react';
import type { DirectUpload, UploadIntent } from '@khan-familia/types';
import { UPLOAD_POLICIES } from '@khan-familia/constants';
import { Button, Input } from '@khan-familia/ui';

type Props = {
  intent: UploadIntent;
  onCompleted: (uploadId: string) => void | Promise<void>;
  label: string;
};

export function DirectUploadInput({ intent, onCompleted, label }: Props) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const document = intent.purpose === 'APPLICATION_DOCUMENT';
  const policy = UPLOAD_POLICIES[intent.purpose];
  const maxMiB = policy.maxBytes / (1024 * 1024);

  const complete = async (uploadId: string) => {
    const response = await fetch(`/api/uploads/${uploadId}/complete`, { method: 'POST' });
    if (!response.ok) throw new Error('Upload verification failed. Retry verification shortly.');
    await onCompleted(uploadId);
    setPendingId(null);
  };
  const upload = async (file: File) => {
    setBusy(true);
    setError('');
    setPendingId(null);
    try {
      const formats: readonly string[] = policy.allowedFormats;
      if (
        file.size === 0 ||
        file.size > policy.maxBytes ||
        !formats.includes(file.name.split('.').pop()?.toLowerCase() ?? '')
      ) {
        throw new Error(`Choose a supported file smaller than ${maxMiB} MiB.`);
      }
      const authorization = await fetch('/api/uploads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(intent),
      });
      if (!authorization.ok)
        throw new Error('Upload not authorized. Check your access and try again.');
      const upload = (await authorization.json()) as DirectUpload;
      const form = new FormData();
      Object.entries(upload.fields).forEach(([key, value]) => form.append(key, value));
      form.append('file', file);
      const result = await fetch(upload.uploadUrl, { method: 'POST', body: form });
      if (!result.ok) throw new Error('File upload failed. Please try again.');
      setPendingId(upload.uploadId);
      await complete(upload.uploadId);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Upload failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };
  const retry = async () => {
    if (!pendingId) return;
    setBusy(true);
    setError('');
    try {
      await complete(pendingId);
    } catch {
      setError('Could not finish this upload. Retry or select the file again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Input
        id={id}
        type="file"
        disabled={busy}
        accept={policy.allowedFormats.map((format) => `.${format}`).join(',')}
        aria-describedby={`${id}-status`}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
          event.target.value = '';
        }}
      />
      <p id={`${id}-status`} role="status" className="text-sm text-muted-foreground">
        {busy
          ? 'Uploading and verifying…'
          : error ||
            `${policy.allowedFormats.join(', ').toUpperCase()}, up to ${maxMiB} MiB.${document ? ' Private document.' : ''}`}
      </p>
      {pendingId && !busy && (
        <Button type="button" variant="outline" onClick={() => void retry()}>
          Retry verification
        </Button>
      )}
    </div>
  );
}
