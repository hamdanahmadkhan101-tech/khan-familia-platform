'use client';

import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { submitApplicationBodySchema, type SubmitApplicationBody } from '@khan-familia/validation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import { Button } from '@khan-familia/ui';
import { useRouter } from 'next/navigation';

// Steps
import { StepPersonal } from './steps/step-personal';
import { StepBusiness } from './steps/step-business';
import { StepLocation } from './steps/step-location';
import { StepVerification } from './steps/step-verification';
import { StepReview } from './steps/step-review';

const STEPS = [
  { id: 'personal', title: 'Personal Info' },
  { id: 'business', title: 'Business Details' },
  { id: 'location', title: 'Location' },
  { id: 'verification', title: 'Verification' },
  { id: 'review', title: 'Review & Submit' },
];

export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const methods = useForm<SubmitApplicationBody>({
    resolver: zodResolver(submitApplicationBodySchema),
    mode: 'onTouched',
    defaultValues: {
      fullName: '',
      phone: '',
      businessName: '',
      businessAddress: '',
      city: '',
      country: '',
      govIdNumber: '',
      businessRegNumber: '',
      experience: '',
      documents: [],
    },
  });

  const { handleSubmit, trigger } = methods;

  const next = async () => {
    let fieldsToValidate: Array<keyof SubmitApplicationBody> = [];

    if (currentStep === 0) fieldsToValidate = ['fullName', 'phone', 'phoneCountryCode', 'altEmail'];
    if (currentStep === 1)
      fieldsToValidate = ['businessName', 'businessVertical', 'experience', 'businessWebsite'];
    if (currentStep === 2)
      fieldsToValidate = ['businessAddress', 'city', 'state', 'postalCode', 'country'];
    if (currentStep === 3)
      fieldsToValidate = ['govIdType', 'govIdNumber', 'businessRegNumber', 'taxId', 'documents'];

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep((step) => Math.min(step + 1, STEPS.length - 1));
    }
  };

  const prev = () => {
    setCurrentStep((step) => Math.max(step - 1, 0));
  };

  const onSubmit = async (data: SubmitApplicationBody) => {
    setIsSubmitting(true);
    try {
      // Import createApiClient here or pass as prop if needed
      // For simplicity in a client component, we hit an API route, or if we have an authenticated client fetcher
      // Wait, we can use a server action or just standard fetch to our backend.
      // Since our SDK is designed to be used with the getToken injected, let's just use fetch to the API directly for now.
      // Or we can use the SDK if we inject the token.
      // A better approach is hitting our Next.js API route which will act as a proxy or use Server Actions.

      const res = await fetch('/api/tenants/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error('Failed to submit application');
      }

      router.push('/onboarding/pending');
    } catch (error) {
      console.error(error);
      alert('An error occurred submitting your application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Sidebar Progress */}
      <div className="md:w-64 flex-shrink-0">
        <nav aria-label="Progress">
          <ol role="list" className="overflow-hidden space-y-6">
            {STEPS.map((step, index) => {
              const isCurrent = currentStep === index;
              const isCompleted = currentStep > index;

              return (
                <li key={step.id} className="relative">
                  <div className="group flex items-center">
                    <span className="flex h-9 items-center">
                      <span
                        className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full ${
                          isCompleted
                            ? 'bg-slate-900 text-white'
                            : isCurrent
                              ? 'border-2 border-slate-900 bg-white text-slate-900'
                              : 'border-2 border-slate-300 bg-white text-slate-500'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5 text-white" aria-hidden="true" />
                        ) : (
                          <span className="text-sm font-medium">{index + 1}</span>
                        )}
                      </span>
                    </span>
                    <span className="ml-4 flex min-w-0 flex-col">
                      <span
                        className={`text-sm font-medium tracking-wide ${
                          isCurrent ? 'text-slate-900' : 'text-slate-500'
                        }`}
                      >
                        {step.title}
                      </span>
                    </span>
                  </div>
                  {index !== STEPS.length - 1 && (
                    <div
                      className="absolute left-4 top-10 -ml-px h-full w-0.5 bg-slate-200"
                      aria-hidden="true"
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      {/* Main Form Content */}
      <div className="flex-1 min-w-0">
        <FormProvider {...methods}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (currentStep === STEPS.length - 1) {
                handleSubmit(onSubmit)(e);
              } else {
                next();
              }
            }}
            className="space-y-8"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="min-h-[400px]"
              >
                {currentStep === 0 && <StepPersonal />}
                {currentStep === 1 && <StepBusiness />}
                {currentStep === 2 && <StepLocation />}
                {currentStep === 3 && <StepVerification />}
                {currentStep === 4 && <StepReview />}
              </motion.div>
            </AnimatePresence>

            {/* Navigation Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={prev}
                disabled={currentStep === 0 || isSubmitting}
              >
                Back
              </Button>

              {currentStep === STEPS.length - 1 ? (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </Button>
              ) : (
                <Button type="button" onClick={next}>
                  Next <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
