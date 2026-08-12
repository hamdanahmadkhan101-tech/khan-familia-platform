import { useFormContext } from 'react-hook-form';
import type { SubmitApplicationBody } from '@khan-familia/validation';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@khan-familia/ui';

export function StepBusiness() {
  const { control } = useFormContext<SubmitApplicationBody>();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Business Details</h2>
        <p className="text-slate-500">Tell us about your business or services.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="businessName"
          render={({ field }) => (
            <FormItem className="col-span-1 md:col-span-2">
              <FormLabel>Business Name</FormLabel>
              <FormControl>
                <Input placeholder="Khan Properties LLC" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="businessVertical"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business Vertical</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a vertical" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="ACCOMMODATIONS_STAYS">Accommodations & Stays</SelectItem>
                  <SelectItem value="EXPERIENCES_TOURS">Experiences & Tours</SelectItem>
                  <SelectItem value="VEHICLE_RENTALS">Vehicle Rentals</SelectItem>
                  <SelectItem value="VENUES_EVENTS">Venues & Events</SelectItem>
                  <SelectItem value="FOOD_DINING">Food & Dining</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="businessWebsite"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business Website (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://example.com"
                  type="url"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="experience"
          render={({ field }) => (
            <FormItem className="col-span-1 md:col-span-2">
              <FormLabel>Experience & Background</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your experience in this business..."
                  className="min-h-[120px]"
                  {...field}
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
