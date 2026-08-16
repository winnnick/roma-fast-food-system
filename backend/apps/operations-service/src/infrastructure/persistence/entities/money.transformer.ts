import type { ValueTransformer } from 'typeorm';
export const moneyTransformer: ValueTransformer = {
  to(value: number | null): number | null {
    return value === null ? null : Number(value.toFixed(2));
  },
  from(value: string | number | null): number | null {
    return value === null ? null : Number(value);
  },
};
