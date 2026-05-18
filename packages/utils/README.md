# @khan-familia/utils

Shared, framework-agnostic utility helpers for financial math, date operations, and slug/id generation.

## Usage

```ts
import { decimalFrom, formatIsoDate, generateSlug, multiplyMoney } from '@khan-familia/utils';

const price = decimalFrom('1999.99');
const subtotal = multiplyMoney(price, 2).toFixed(2);
const slug = generateSlug('Hunza Family Tour');
const date = formatIsoDate(new Date());
```
