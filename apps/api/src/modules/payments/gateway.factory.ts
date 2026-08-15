import type { PaymentProvider } from '@khan-familia/database';
import type { PaymentGateway } from './gateway.interface.js';
import { StripeGateway } from './stripe.gateway.js';
import { RapidGateway } from './rapid.gateway.js';
import { AppError } from '../../shared/errors/AppError.js';

export class PaymentGatewayFactory {
  static getGateway(provider: PaymentProvider): PaymentGateway {
    switch (provider) {
      case 'STRIPE':
        return new StripeGateway();
      case 'RAPID_GATEWAY':
        return new RapidGateway();
      case 'MANUAL':
        throw AppError.badRequest('Manual payments do not have a gateway integration.');
      default:
        throw AppError.internal(`Gateway not implemented for provider: ${provider as string}`);
    }
  }
}
