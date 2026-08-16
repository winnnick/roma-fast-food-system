import type { ValueTransformer } from 'typeorm';

export const quantityTransformer: ValueTransformer = {
  to(value: number | null): number | null {
    return value === null ? null : Number(value.toFixed(4));
  },
  from(value: string | number | null): number | null {
    return value === null ? null : Number(value);
  },
};

export const moneyTransformer: ValueTransformer = {
  to(value: number | null): number | null {
    return value === null ? null : Number(value.toFixed(2));
  },
  from(value: string | number | null): number | null {
    return value === null ? null : Number(value);
  },
};

export const unitCostTransformer: ValueTransformer = {
  to(value: number | null): number | null {
    return value === null ? null : Number(value.toFixed(6));
  },
  from(value: string | number | null): number | null {
    return value === null ? null : Number(value);
  },
};
