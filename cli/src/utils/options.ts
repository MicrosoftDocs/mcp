import { InvalidArgumentError } from 'commander';

import { DEFAULT_ENDPOINT, DOCTOR_FORMATS, type DoctorFormat } from './contracts.js';
import { UsageError } from './errors.js';

export function parsePositiveInteger(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new InvalidArgumentError('Expected a positive integer.');
  }

  return parsed;
}

export function parseDoctorFormat(value: string): DoctorFormat {
  return parseEnumValue(value, DOCTOR_FORMATS, 'doctor format');
}

export function resolveEndpoint(endpointOption: string | undefined, env: NodeJS.ProcessEnv): string {
  const endpoint = endpointOption ?? env.MSLEARN_ENDPOINT ?? DEFAULT_ENDPOINT;

  try {
    return new URL(endpoint).toString();
  } catch (error) {
    throw new UsageError(`Invalid endpoint URL: ${endpoint}`, { cause: error });
  }
}

export function normalizeUrl(value: string): string {
  try {
    return new URL(value).toString();
  } catch (error) {
    throw new UsageError(`Invalid URL: ${value}`, { cause: error });
  }
}

function parseEnumValue<TValue extends string>(value: string, allowedValues: readonly TValue[], label: string): TValue {
  if (allowedValues.includes(value as TValue)) {
    return value as TValue;
  }

  throw new InvalidArgumentError(`Unsupported ${label}. Expected one of: ${allowedValues.join(', ')}.`);
}
