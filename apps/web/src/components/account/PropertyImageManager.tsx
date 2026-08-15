'use client';

import { CldUploadWidget, type CloudinaryUploadWidgetInfo } from 'next-cloudinary';
import { Button } from '@khan-familia/ui';
import { ImagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { addPropertyImage } from '../../app/account/properties/actions';

interface PropertyImageManagerProps {
  propertyId: string;
}

export function PropertyImageManager({ propertyId }: PropertyImageManagerProps) {
  const handleSuccess = (result: unknown) => {
    if (
      result &&
      typeof result === 'object' &&
      'event' in result &&
      result.event === 'success' &&
      'info' in result
    ) {
      const info = result.info as CloudinaryUploadWidgetInfo;
      void (async () => {
        try {
          await addPropertyImage(propertyId, info.secure_url, info.public_id);
          toast.success('Image uploaded and linked successfully!');
        } catch {
          toast.error('Image uploaded to Cloudinary, but failed to link to property.');
        }
      })();
    }
  };

  return (
    <div className="mt-4">
      <CldUploadWidget
        signatureEndpoint="/api/cloudinary-signature"
        uploadPreset="ml_default"
        onSuccess={handleSuccess}
      >
        {({ open }) => (
          <Button onClick={() => open()} variant="outline" className="w-full sm:w-auto">
            <ImagePlus className="w-4 h-4 mr-2" />
            Upload New Image
          </Button>
        )}
      </CldUploadWidget>
    </div>
  );
}
