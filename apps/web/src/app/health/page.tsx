import { HealthPanel } from '@/components/HealthPanel';

export default function HealthPage() {
  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto w-full max-w-4xl">
        <section className="rounded-3xl border border-slate-200 bg-white/70 p-8 shadow-sm backdrop-blur">
          <HealthPanel />
        </section>
      </div>
    </main>
  );
}
