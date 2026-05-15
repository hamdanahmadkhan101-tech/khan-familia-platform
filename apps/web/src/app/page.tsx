import { SERVICE_NAME_VALUES } from '@khan-familia/constants';

import { HealthPanel } from '@/components/HealthPanel';
import { publicEnv } from '@/lib/env';

const serviceLine = SERVICE_NAME_VALUES.join(' • ');

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Monorepo foundation</p>
          <h1 className="text-4xl font-semibold text-slate-900 sm:text-5xl">{publicEnv.appName}</h1>
          <p className="max-w-2xl text-base text-slate-600 sm:text-lg">
            Production-grade scaffolding for web, api, and worker apps. This layer is intentionally
            infrastructure only.
          </p>
        </header>

        <section className="rounded-3xl border border-slate-200 bg-white/70 p-8 shadow-sm backdrop-blur">
          <HealthPanel />
        </section>

        <section className="grid gap-2 text-sm text-slate-600">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white">
              Services
            </span>
            <span>{serviceLine}</span>
          </div>
          <div>
            API base URL:{' '}
            <span className="font-semibold text-slate-900">{publicEnv.apiBaseUrl}</span>
          </div>
        </section>
      </div>
    </main>
  );
}
