import { Decimal } from 'decimal.js';

export type DecimalInput = Decimal.Value;

export const decimalFrom = (value: DecimalInput): Decimal => new Decimal(value);

export const addMoney = (left: DecimalInput, right: DecimalInput): Decimal =>
  decimalFrom(left).plus(right);

export const subtractMoney = (left: DecimalInput, right: DecimalInput): Decimal =>
  decimalFrom(left).minus(right);

export const multiplyMoney = (left: DecimalInput, right: DecimalInput): Decimal =>
  decimalFrom(left).times(right);

export const applyDiscount = (amount: DecimalInput, discountPercent: DecimalInput): Decimal => {
  const discount = decimalFrom(discountPercent).div(100);
  return decimalFrom(amount).mul(decimalFrom(1).minus(discount));
};

export const toStorageMoney = (value: DecimalInput): string =>
  decimalFrom(value).toDecimalPlaces(2).toString();
