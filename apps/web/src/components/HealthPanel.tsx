import { SERVICE_NAMES } from '@khan-familia/constants';

import { healthUrl } from '@/features/health/health-client';
import { publicEnv } from '@/lib/env';

import { HealthActions } from './HealthActions';

const services = Object.values(SERVICE_NAMES).join(', ');

export const HealthPanel = () => {
  return (
    <div className="grid gap-5">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Health</p>
        <h2 className="text-2xl font-semibold text-slate-900">API readiness</h2>
        <p className="text-sm text-slate-600">
          Wire the API to /health and validate the baseline contract.
        </p>
      </div>

      <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <div>
          App name: <span className="font-semibold text-slate-900">{publicEnv.appName}</span>
        </div>
        <div>
          API base URL: <span className="font-semibold text-slate-900">{publicEnv.apiBaseUrl}</span>
        </div>
        <div>
          Health endpoint: <span className="font-semibold text-slate-900">{healthUrl}</span>
        </div>
      </div>

      <HealthActions healthUrl={healthUrl} />

      <p className="text-xs text-slate-500">Services: {services}</p>
    </div>
  );
};
