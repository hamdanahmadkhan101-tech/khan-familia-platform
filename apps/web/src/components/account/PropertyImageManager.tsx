'use client';

import { toast } from 'sonner';
import { addPropertyImage } from '../../app/account/properties/actions';
import { DirectUploadInput } from '../uploads/DirectUploadInput';

export function PropertyImageManager({ propertyId }: { propertyId: string }) {
  return (
    <div className="mt-4">
      <DirectUploadInput
        intent={{ purpose: 'PROPERTY_PHOTO', propertyId }}
        label="Upload property photo"
        onCompleted={async (uploadId) => {
          await addPropertyImage(propertyId, uploadId);
          toast.success('Photo uploaded and linked successfully');
        }}
      />
    </div>
  );
}
