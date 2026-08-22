import { Decimal } from 'decimal.js';

export type DecimalInput = Decimal.Value;

/**
 * Converts a standard decimal currency amount (e.g. 100.50 PKR) to its minor units (e.g. 10050 cents/paisa).
 * Uses half-up rounding to ensure absolute precision.
 */
export const toMinorUnits = (value: DecimalInput): number => {
  return new Decimal(value).mul(100).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();
};

/**
 * Converts a minor units amount (e.g. 10050) back to standard currency amount (e.g. 100.50).
 */
export const fromMinorUnits = (minorUnits: DecimalInput): number => {
  return new Decimal(minorUnits).div(100).toNumber();
};

/**
 * Adds two minor-unit values (integers) safely.
 */
export const addMoney = (left: number, right: number): number => {
  return new Decimal(left).plus(right).toNumber();
};

/**
 * Subtracts two minor-unit values (integers) safely.
 */
export const subtractMoney = (left: number, right: number): number => {
  return new Decimal(left).minus(right).toNumber();
};

/**
 * Multiplies a minor-unit value (integer) by a factor (e.g. tax rate or multiplier) safely.
 * Returns the rounded integer value in minor units.
 */
export const multiplyMoney = (minorUnits: number, factor: DecimalInput): number => {
  return new Decimal(minorUnits).times(factor).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();
};

/**
 * Applies a percentage discount to a minor-unit amount safely.
 * Returns the rounded integer value in minor units.
 */
export const applyDiscount = (minorUnits: number, discountPercent: DecimalInput): number => {
  let discount = new Decimal(discountPercent);
  if (discount.lessThan(0)) discount = new Decimal(0);
  if (discount.greaterThan(100)) discount = new Decimal(100);

  const discountFactor = discount.div(100);
  const factor = new Decimal(1).minus(discountFactor);
  return new Decimal(minorUnits).times(factor).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();
};
