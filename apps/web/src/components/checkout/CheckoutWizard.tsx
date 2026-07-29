'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { CheckoutWrapper } from './CheckoutWrapper';
import { createPaymentIntentAction } from '@/app/checkout/[holdToken]/actions';
import { toast } from 'sonner';
import { IMaskInput } from 'react-imask';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { guestsFormSchema, type GuestsFormInput } from '@khan-familia/validation';
import {
  Loader2,
  User,
  Users,
  Info,
  CreditCard,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  ShieldCheck,
  Lock,
} from 'lucide-react';

interface CheckoutWizardProps {
  holdToken: string;
}

const SPECIAL_NEEDS_OPTIONS = [
  { label: 'Early Check-in', icon: '🌅' },
  { label: 'Late Check-out', icon: '🌙' },
  { label: 'Extra Bed', icon: '🛏️' },
  { label: 'Wheelchair Access', icon: '♿' },
  { label: 'Quiet Room', icon: '🤫' },
  { label: 'High Floor', icon: '🏔️' },
];

export function CheckoutWizard({ holdToken }: CheckoutWizardProps) {
  const { user, isLoaded } = useUser();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const { control, trigger, setValue, watch } = useForm<GuestsFormInput>({
    resolver: zodResolver(guestsFormSchema),
    defaultValues: {
      guests: [{ isPrimary: true, name: '', age: 0, idType: 'CNIC', idNumber: '' }],
    },
    mode: 'onTouched',
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'guests',
  });

  const guests = watch('guests');

  useEffect(() => {
    if (isLoaded && user && guests.length > 0 && !guests[0]?.name) {
      setValue('guests.0.name', user.fullName || user.firstName || '', { shouldValidate: true });
    }
  }, [isLoaded, user, guests, setValue]);

  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);
  const [customNeed, setCustomNeed] = useState('');
  const [paymentData, setPaymentData] = useState<{ clientSecret: string; amount: number } | null>(
    null,
  );

  const toggleNeed = (need: string) => {
    if (selectedNeeds.includes(need)) {
      setSelectedNeeds(selectedNeeds.filter((n) => n !== need));
    } else {
      setSelectedNeeds([...selectedNeeds, need]);
    }
  };

  const handleStep2Next = async () => {
    const isValid = await trigger('guests');
    if (isValid) {
      setStep(3);
    } else {
      toast.error('Please fix the errors in the guest details.');
    }
  };

  const proceedToPayment = async () => {
    try {
      setIsLoading(true);

      const formattedGuests = guests.map((g) => ({
        ...g,
        idNumber: g.idNumber ? g.idNumber.replace(/-/g, '') : undefined,
      }));

      const finalNeeds = [...selectedNeeds];
      const sanitizedCustom = customNeed.trim().replace(/\s+/g, ' ');
      if (sanitizedCustom.length > 500) {
        toast.error('Custom request is too long (max 500 characters).');
        setStep(3);
        return;
      }
      if (sanitizedCustom) finalNeeds.push(sanitizedCustom);

      const res = await createPaymentIntentAction(holdToken, formattedGuests, finalNeeds);
      setPaymentData({ clientSecret: res.clientSecret, amount: res.amount });
      setStep(4);
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || 'Failed to process details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { icon: User, label: 'Contact', num: 1 },
    { icon: Users, label: 'Guests', num: 2 },
    { icon: Info, label: 'Requests', num: 3 },
    { icon: CreditCard, label: 'Payment', num: 4 },
  ];

  return (
    <div className="mx-auto max-w-4xl relative">
      <div className="mb-12 hidden md:flex items-center justify-between relative px-4">
        <div className="absolute left-10 right-10 top-1/2 h-1.5 -translate-y-1/2 bg-muted/50 rounded-full overflow-hidden backdrop-blur-sm">
          <div
            className="h-full bg-gradient-to-r from-primary/50 to-primary transition-all duration-700 ease-in-out shadow-[0_0_10px_rgba(var(--primary),0.5)]"
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          />
        </div>

        {steps.map((s) => {
          const isCompleted = step > s.num;
          const isActive = step === s.num;

          return (
            <div key={s.num} className="relative z-10 flex flex-col items-center gap-3">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl border-[3px] transition-all duration-500 ${
                  isCompleted
                    ? 'border-green-500 bg-green-500/10 text-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]'
                    : isActive
                      ? 'border-primary bg-background text-primary shadow-[0_0_20px_rgba(var(--primary),0.2)] scale-110'
                      : 'border-muted bg-background text-muted-foreground'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-7 w-7 animate-in zoom-in" />
                ) : (
                  <s.icon className={`h-6 w-6 ${isActive ? 'animate-pulse' : ''}`} />
                )}
              </div>
              <span
                className={`text-sm font-semibold tracking-wide transition-colors duration-500 ${
                  isActive || isCompleted ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="relative overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/60 dark:bg-black/40 p-6 sm:p-10 shadow-2xl shadow-primary/5 backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 dark:to-transparent" />

        <div className="relative">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="text-center">
                <h2 className="font-display text-3xl font-bold tracking-tight">
                  Primary Contact Info
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Your booking will be securely associated with your account.
                </p>
              </div>

              <div className="mx-auto max-w-md overflow-hidden rounded-3xl border border-white/40 dark:border-white/10 bg-white/50 dark:bg-black/50 p-8 shadow-xl backdrop-blur-md">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                    <ShieldCheck className="h-10 w-10 text-primary" />
                    <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-4 border-background bg-green-500">
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-foreground">
                      Verified by Clerk
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      We will use your securely registered email for all booking communications,
                      updates, and receipts.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 font-semibold text-primary-foreground transition-all hover:scale-105 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/20"
                >
                  Continue to Guest Details <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="text-center">
                <h2 className="font-display text-3xl font-bold tracking-tight">Who is staying?</h2>
                <p className="mt-2 text-muted-foreground">
                  Please provide details for the guests. The primary guest must be present at
                  check-in.
                </p>
              </div>

              <div className="space-y-6">
                {fields.map((field, idx) => (
                  <div
                    key={field.id}
                    className="relative overflow-hidden rounded-[2rem] border border-white/40 dark:border-white/10 bg-white/50 dark:bg-black/50 p-6 sm:p-8 shadow-lg backdrop-blur-md transition-all hover:shadow-xl"
                  >
                    {idx > 0 && (
                      <button
                        onClick={() => remove(idx)}
                        className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}

                    <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
                      <User className="h-4 w-4" />
                      {idx === 0 ? 'Primary Guest' : `Guest ${idx + 1}`}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="relative">
                        <Controller
                          name={`guests.${idx}.name`}
                          control={control}
                          render={({ field: inputProps, fieldState: { error } }) => (
                            <>
                              <input
                                {...inputProps}
                                id={`name-${idx}`}
                                className={`peer w-full rounded-2xl border ${error ? 'border-red-500 bg-red-50 focus:ring-red-500/10 dark:bg-red-950/20' : 'border-border/50 bg-background/50 focus:border-primary focus:ring-primary/10'} px-5 pb-3 pt-7 text-sm text-foreground outline-none transition-all focus:bg-background focus:ring-4`}
                                placeholder=" "
                              />
                              <label
                                htmlFor={`name-${idx}`}
                                className={`absolute left-5 top-5 z-10 origin-[0] -translate-y-3 scale-75 transform transition-all peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-3 peer-focus:scale-75 font-medium ${error ? 'text-red-500' : 'text-muted-foreground peer-focus:text-primary'}`}
                              >
                                Full Name (as on ID)
                              </label>
                              {error && (
                                <p className="mt-1 text-xs text-red-500 pl-2">{error.message}</p>
                              )}
                            </>
                          )}
                        />
                      </div>

                      <div className="relative">
                        <Controller
                          name={`guests.${idx}.age`}
                          control={control}
                          render={({
                            field: { value, onChange, ...inputProps },
                            fieldState: { error },
                          }) => (
                            <>
                              <input
                                {...inputProps}
                                type="number"
                                id={`age-${idx}`}
                                value={value === 0 && !inputProps.onBlur ? '' : value}
                                onChange={(e) =>
                                  onChange(e.target.value === '' ? '' : Number(e.target.value))
                                }
                                className={`peer w-full rounded-2xl border ${error ? 'border-red-500 bg-red-50 focus:ring-red-500/10 dark:bg-red-950/20' : 'border-border/50 bg-background/50 focus:border-primary focus:ring-primary/10'} px-5 pb-3 pt-7 text-sm text-foreground outline-none transition-all focus:bg-background focus:ring-4`}
                                placeholder=" "
                              />
                              <label
                                htmlFor={`age-${idx}`}
                                className={`absolute left-5 top-5 z-10 origin-[0] -translate-y-3 scale-75 transform transition-all peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-3 peer-focus:scale-75 font-medium ${error ? 'text-red-500' : 'text-muted-foreground peer-focus:text-primary'}`}
                              >
                                Age
                              </label>
                              {error && (
                                <p className="mt-1 text-xs text-red-500 pl-2">{error.message}</p>
                              )}
                            </>
                          )}
                        />
                      </div>

                      <div className="relative">
                        <Controller
                          name={`guests.${idx}.idType`}
                          control={control}
                          render={({ field: inputProps }) => (
                            <>
                              <select
                                {...inputProps}
                                id={`idType-${idx}`}
                                className="w-full rounded-2xl border border-border/50 bg-background/50 px-5 pb-3 pt-7 text-sm text-foreground outline-none transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10 appearance-none cursor-pointer"
                              >
                                <option value="CNIC">CNIC</option>
                                <option value="Passport">Passport</option>
                                <option value="Other">Other</option>
                              </select>
                              <label
                                htmlFor={`idType-${idx}`}
                                className="absolute left-5 top-2.5 z-10 scale-75 text-muted-foreground font-medium"
                              >
                                ID Type
                              </label>
                            </>
                          )}
                        />
                      </div>

                      <div className="relative">
                        <Controller
                          name={`guests.${idx}.idNumber`}
                          control={control}
                          render={({
                            field: { onChange, value, ...inputProps },
                            fieldState: { error },
                          }) => (
                            <>
                              {guests[idx]?.idType === 'CNIC' ? (
                                <IMaskInput
                                  {...inputProps}
                                  mask="00000-0000000-0"
                                  id={`idNum-${idx}`}
                                  value={value || ''}
                                  unmask={false}
                                  onAccept={(val) => onChange(val)}
                                  className={`peer w-full rounded-2xl border ${error ? 'border-red-500 bg-red-50 focus:ring-red-500/10 dark:bg-red-950/20' : 'border-border/50 bg-background/50 focus:border-primary focus:ring-primary/10'} px-5 pb-3 pt-7 text-sm text-foreground outline-none transition-all focus:bg-background focus:ring-4`}
                                  placeholder=" "
                                />
                              ) : (
                                <input
                                  {...inputProps}
                                  type="text"
                                  id={`idNum-${idx}`}
                                  value={value || ''}
                                  onChange={onChange}
                                  className={`peer w-full rounded-2xl border ${error ? 'border-red-500 bg-red-50 focus:ring-red-500/10 dark:bg-red-950/20' : 'border-border/50 bg-background/50 focus:border-primary focus:ring-primary/10'} px-5 pb-3 pt-7 text-sm text-foreground outline-none transition-all focus:bg-background focus:ring-4`}
                                  placeholder=" "
                                />
                              )}
                              <label
                                htmlFor={`idNum-${idx}`}
                                className={`absolute left-5 top-5 z-10 origin-[0] -translate-y-3 scale-75 transform transition-all peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-3 peer-focus:scale-75 font-medium ${error ? 'text-red-500' : 'text-muted-foreground peer-focus:text-primary'}`}
                              >
                                ID Number (Secure)
                              </label>
                              {error && (
                                <p className="mt-1 text-xs text-red-500 pl-2">{error.message}</p>
                              )}
                            </>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() =>
                  append({ isPrimary: false, name: '', age: 0, idType: 'CNIC', idNumber: '' })
                }
                className="group flex w-full flex-col items-center justify-center gap-3 rounded-[2rem] border-2 border-dashed border-primary/30 bg-primary/5 py-10 transition-all hover:border-primary/60 hover:bg-primary/10 active:scale-[0.98]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary transition-transform group-hover:scale-110">
                  <Plus className="h-6 w-6" />
                </div>
                <span className="font-semibold text-primary">Add Another Guest</span>
              </button>

              <div className="flex items-center justify-between pt-8">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 rounded-2xl px-6 py-3.5 font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <ChevronLeft className="h-5 w-5" /> Back
                </button>
                <button
                  onClick={handleStep2Next}
                  className="flex items-center gap-2 rounded-2xl bg-primary px-8 py-3.5 font-semibold text-primary-foreground transition-all hover:scale-105 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/20"
                >
                  Special Requests <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="text-center">
                <h2 className="font-display text-3xl font-bold tracking-tight">Special Requests</h2>
                <p className="mt-2 text-muted-foreground">
                  Let us know how we can make your stay perfect. (Subject to availability)
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {SPECIAL_NEEDS_OPTIONS.map((need) => {
                  const isSelected = selectedNeeds.includes(need.label);
                  return (
                    <button
                      key={need.label}
                      onClick={() => toggleNeed(need.label)}
                      className={`flex flex-col items-center justify-center gap-3 rounded-3xl border-2 p-6 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary shadow-lg shadow-primary/10'
                          : 'border-border/50 bg-background/50 text-muted-foreground hover:border-primary/30 hover:bg-background'
                      }`}
                    >
                      <span className="text-3xl">{need.icon}</span>
                      <span className="font-semibold">{need.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="relative mt-8">
                <textarea
                  value={customNeed}
                  onChange={(e) => setCustomNeed(e.target.value)}
                  className="peer w-full min-h-[140px] rounded-[2rem] border border-border/50 bg-background/50 p-6 pt-8 text-base text-foreground outline-none transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10 resize-none"
                  placeholder=" "
                />
                <label className="absolute left-6 top-6 z-10 origin-[0] -translate-y-3 scale-75 transform text-muted-foreground transition-all peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-3 peer-focus:scale-75 peer-focus:text-primary font-medium">
                  Anything else we should know? (Optional)
                </label>
              </div>

              <div className="flex items-center justify-between pt-8">
                <button
                  disabled={isLoading}
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 rounded-2xl px-6 py-3.5 font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                >
                  <ChevronLeft className="h-5 w-5" /> Back
                </button>
                <button
                  disabled={isLoading}
                  onClick={proceedToPayment}
                  className="flex items-center gap-2 rounded-2xl bg-primary px-8 py-3.5 font-semibold text-primary-foreground transition-all hover:scale-105 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/20 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Proceed to Payment <ChevronRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 4 && paymentData && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
                <h2 className="font-display text-3xl font-bold tracking-tight">Secure Payment</h2>
                <p className="mt-2 text-muted-foreground">
                  Your payment information is encrypted and securely processed by Stripe.
                </p>
              </div>

              <div className="w-full">
                <CheckoutWrapper
                  clientSecret={paymentData.clientSecret}
                  amount={paymentData.amount}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
