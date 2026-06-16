export interface BookingExpiryJobPayload {
  bookingId: string;
  holdExpiresAt: string;
}

export interface NotificationJobPayload {
  type: 'email';
  userId: string;
  template: string;
  data: Record<string, unknown>;
}

export interface InventoryHorizonJobPayload {
  propertyId: string;
}

export type JobPayload =
  | BookingExpiryJobPayload
  | NotificationJobPayload
  | InventoryHorizonJobPayload;
