# @khan-familia/validation

Zod-based validation helpers shared across apps and packages.

## Usage

```ts
import { appEnvSchema, healthStatusSchema, z } from '@khan-familia/validation';

const env = appEnvSchema.parse('local');
const health = healthStatusSchema.parse({
  status: 'ok',
  service: 'api',
  timestamp: new Date().toISOString(),
});
```
