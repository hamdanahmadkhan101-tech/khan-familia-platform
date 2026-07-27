'use client';

import { useState } from 'react';
import { CheckoutWrapper } from './CheckoutWrapper';
import { createPaymentIntentAction } from '@/app/checkout/[holdToken]/actions';
import { toast } from 'sonner';
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
} from 'lucide-react';

interface CheckoutWizardProps {
  holdToken: string;
}

const SPECIAL_NEEDS_OPTIONS = [
  'Early Check-in',
  'Late Check-out',
  'Extra Bed',
  'Wheelchair Access',
  'Quiet Room',
  'High Floor',
];

export function CheckoutWizard({ holdToken }: CheckoutWizardProps) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Contact is handled by clerk but we'll just acknowledge it

  // Step 2: Guests
  type Guest = { isPrimary: boolean; name: string; age: string; idType: string; idNumber: string };
  const [guests, setGuests] = useState<Guest[]>([
    { isPrimary: true, name: '', age: '', idType: 'CNIC', idNumber: '' },
  ]);

  // Step 3: Special Needs
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);
  const [customNeed, setCustomNeed] = useState('');

  // Step 4: Payment
  const [paymentData, setPaymentData] = useState<{ clientSecret: string; amount: number } | null>(
    null,
  );

  const handleAddGuest = () => {
    setGuests([...guests, { isPrimary: false, name: '', age: '', idType: 'CNIC', idNumber: '' }]);
  };

  const handleRemoveGuest = (index: number) => {
    setGuests(guests.filter((_, i) => i !== index));
  };

  const updateGuest = (index: number, field: keyof Guest, value: string | boolean) => {
    const newGuests = [...guests];
    newGuests[index] = { ...newGuests[index], [field]: value } as Guest;
    setGuests(newGuests);
  };

  const toggleNeed = (need: string) => {
    if (selectedNeeds.includes(need)) {
      setSelectedNeeds(selectedNeeds.filter((n) => n !== need));
    } else {
      setSelectedNeeds([...selectedNeeds, need]);
    }
  };

  const proceedToPayment = async () => {
    try {
      setIsLoading(true);

      // Validate primary guest at least has a name
      if (!guests[0] || !guests[0].name || guests[0].name.length < 2) {
        toast.error('Please provide a valid name for the primary guest.');
        setStep(2);
        return;
      }

      const formattedGuests = guests.map((g) => ({
        ...g,
        age: g.age ? parseInt(g.age as string) : undefined,
      }));

      const finalNeeds = [...selectedNeeds];
      if (customNeed.trim()) finalNeeds.push(customNeed.trim());

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

  return (
    <div className="mx-auto max-w-4xl">
      {/* Progress Bar */}
      <div className="mb-8 hidden md:flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 ease-in-out"
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          />
        </div>
        {[
          { icon: User, label: 'Contact', num: 1 },
          { icon: Users, label: 'Guests', num: 2 },
          { icon: Info, label: 'Requests', num: 3 },
          { icon: CreditCard, label: 'Payment', num: 4 },
        ].map((s) => (
          <div key={s.num} className="relative z-10 flex flex-col items-center gap-2">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full border-4 transition-colors ${step >= s.num ? 'border-primary bg-primary text-primary-foreground' : 'border-background bg-muted text-muted-foreground'}`}
            >
              {step > s.num ? <CheckCircle2 className="h-6 w-6" /> : <s.icon className="h-5 w-5" />}
            </div>
            <span
              className={`text-sm font-medium ${step >= s.num ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold">Primary Contact Info</h2>
            <p className="text-muted-foreground">
              Your booking will be associated with your account.
            </p>

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 flex items-start gap-4">
              <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground">Verified by Clerk</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  We will use your registered email for all booking communications and receipts.
                </p>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
              >
                Next: Guest Details <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="text-2xl font-bold">Who is staying?</h2>
              <p className="text-muted-foreground">
                Please provide details for the guests staying at the property. The primary guest
                must be present at check-in.
              </p>
            </div>

            <div className="space-y-6">
              {guests.map((guest, idx) => (
                <div
                  key={idx}
                  className="relative rounded-xl border border-border p-5 pt-6 relative group bg-background"
                >
                  {idx > 0 && (
                    <button
                      onClick={() => handleRemoveGuest(idx)}
                      className="absolute right-4 top-4 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}

                  <div className="absolute -top-3 left-4 bg-background px-2 text-sm font-semibold text-primary">
                    {idx === 0 ? 'Primary Guest' : `Guest ${idx + 1}`}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Full Name</label>
                      <input
                        type="text"
                        value={guest.name}
                        onChange={(e) => updateGuest(idx, 'name', e.target.value)}
                        placeholder="John Doe"
                        className="w-full rounded-lg border border-input bg-transparent px-4 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Age</label>
                      <input
                        type="number"
                        value={guest.age}
                        onChange={(e) => updateGuest(idx, 'age', e.target.value)}
                        placeholder="30"
                        className="w-full rounded-lg border border-input bg-transparent px-4 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">ID Type</label>
                      <select
                        value={guest.idType}
                        onChange={(e) => updateGuest(idx, 'idType', e.target.value)}
                        className="w-full rounded-lg border border-input bg-transparent px-4 py-2.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="CNIC">CNIC</option>
                        <option value="Passport">Passport</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">ID Number (Securely Encrypted)</label>
                      <input
                        type="text"
                        value={guest.idNumber}
                        onChange={(e) => updateGuest(idx, 'idNumber', e.target.value)}
                        placeholder="xxxxx-xxxxxxx-x"
                        className="w-full rounded-lg border border-input bg-transparent px-4 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleAddGuest}
              className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              <Plus className="h-4 w-4" /> Add another guest
            </button>

            <div className="pt-4 flex justify-between border-t border-border mt-8">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 rounded-xl border border-input bg-background px-6 py-3 font-semibold hover:bg-muted transition-all"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
              >
                Next: Special Requests <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="text-2xl font-bold">Special Requests</h2>
              <p className="text-muted-foreground">
                Let us know if you need anything extra. (Subject to availability)
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {SPECIAL_NEEDS_OPTIONS.map((need) => (
                <button
                  key={need}
                  onClick={() => toggleNeed(need)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                    selectedNeeds.includes(need)
                      ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20'
                      : 'border-border bg-background hover:border-primary/50 hover:bg-primary/5'
                  }`}
                >
                  {need}
                </button>
              ))}
            </div>

            <div className="space-y-2 pt-4">
              <label className="text-sm font-medium">Other Requests (Optional)</label>
              <textarea
                value={customNeed}
                onChange={(e) => setCustomNeed(e.target.value)}
                placeholder="E.g., I have a pet dog, Need a crib for baby..."
                className="w-full min-h-[100px] rounded-lg border border-input bg-transparent px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>

            <div className="pt-4 flex justify-between border-t border-border mt-8">
              <button
                disabled={isLoading}
                onClick={() => setStep(2)}
                className="flex items-center gap-2 rounded-xl border border-input bg-background px-6 py-3 font-semibold hover:bg-muted transition-all disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
              <button
                disabled={isLoading}
                onClick={proceedToPayment}
                className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Proceed to Payment'}{' '}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {step === 4 && paymentData && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <CheckoutWrapper clientSecret={paymentData.clientSecret} amount={paymentData.amount} />
          </div>
        )}
      </div>
    </div>
  );
}
