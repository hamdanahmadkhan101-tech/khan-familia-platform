import { useFormContext, useFieldArray } from 'react-hook-form';
import type { SubmitApplicationBody } from '@khan-familia/validation';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
} from '@khan-familia/ui';
import { Plus, Trash2, UploadCloud, X } from 'lucide-react';
import { CldUploadWidget, type CloudinaryUploadWidgetInfo } from 'next-cloudinary';

export function StepVerification() {
  const { control } = useFormContext<SubmitApplicationBody>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'documents',
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Verification & Documents
        </h2>
        <p className="text-slate-500">
          Provide official details to verify your identity and business.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="govIdType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gov ID Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ID Type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="PASSPORT">Passport</SelectItem>
                  <SelectItem value="NATIONAL_ID">National ID</SelectItem>
                  <SelectItem value="DRIVING_LICENSE">Driving License</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="govIdNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gov ID Number</FormLabel>
              <FormControl>
                <Input placeholder="Enter ID Number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="businessRegNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business Registration Number</FormLabel>
              <FormControl>
                <Input placeholder="Registration / Trade Number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="taxId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tax ID (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Tax Identification Number"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold">Supporting Documents</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ url: '', type: 'OTHER' })}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Document Link
          </Button>
        </div>

        {fields.length === 0 && (
          <p className="text-sm text-slate-500 italic">
            No documents added. You must upload at least one valid identity or business document.
          </p>
        )}

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-4">
              <FormField
                control={control}
                name={`documents.${index}.url`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      {field.value ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={field.value}
                            readOnly
                            className="bg-slate-50 text-slate-500"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => field.onChange('')}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <CldUploadWidget
                          signatureEndpoint="/api/cloudinary-signature"
                          uploadPreset="ml_default"
                          options={{
                            clientAllowedFormats: ['png', 'jpg', 'jpeg', 'pdf'],
                            maxFileSize: 5000000, // 5MB limit
                            resourceType: 'auto',
                          }}
                          onSuccess={(result) => {
                            if (
                              result &&
                              typeof result === 'object' &&
                              'event' in result &&
                              result.event === 'success' &&
                              'info' in result
                            ) {
                              const info = result.info as CloudinaryUploadWidgetInfo;
                              field.onChange(info.secure_url);
                            }
                          }}
                        >
                          {({ open }) => (
                            <Button
                              type="button"
                              onClick={() => open()}
                              variant="outline"
                              className="w-full justify-start text-slate-500 font-normal"
                            >
                              <UploadCloud className="h-4 w-4 mr-2" />
                              Upload Document (PDF/Image)
                            </Button>
                          )}
                        </CldUploadWidget>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`documents.${index}.type`}
                render={({ field }) => (
                  <FormItem className="w-1/3">
                    <FormControl>
                      <Input placeholder="e.g. REGISTRATION" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
