export function toValidDate(value: unknown): Date | undefined {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  return undefined;
}

export function toIsoString(value: unknown): string | undefined {
  const date = toValidDate(value);
  return date ? date.toISOString() : undefined;
}

export function toUtcString(value: unknown): string | undefined {
  const date = toValidDate(value);
  return date ? date.toUTCString() : undefined;
}
