# @khan-familia/sdk

Typed fetch client scaffolding for platform APIs.

## Usage

```ts
import { createApiClient } from '@khan-familia/sdk';

const client = createApiClient({ baseUrl: 'http://localhost:3001' });
const health = await client.getHealth();
```
