export interface HoldExpiryJobPayload {
  holdId: string;
  holdToken: string;
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

export type JobPayload = HoldExpiryJobPayload | NotificationJobPayload | InventoryHorizonJobPayload;
