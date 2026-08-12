import { useFormContext } from 'react-hook-form';
import type { SubmitApplicationBody } from '@khan-familia/validation';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@khan-familia/ui';
import { Input } from '@khan-familia/ui';

export function StepPersonal() {
  const { control } = useFormContext<SubmitApplicationBody>();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Personal Information</h2>
        <p className="text-slate-500">Provide your contact details so we can reach you.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="fullName"
          render={({ field }) => (
            <FormItem className="col-span-1 md:col-span-2">
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="col-span-1 md:col-span-2 flex gap-4">
          <FormField
            control={control}
            name="phoneCountryCode"
            render={({ field }) => (
              <FormItem className="w-1/3 md:w-1/4">
                <FormLabel>Country Code</FormLabel>
                <FormControl>
                  <Input placeholder="+1" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="phone"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="555-123-4567" type="tel" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={control}
          name="altEmail"
          render={({ field }) => (
            <FormItem className="col-span-1 md:col-span-2">
              <FormLabel>Alternative Email (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="john.doe@example.com"
                  type="email"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
