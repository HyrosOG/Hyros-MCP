// Runtime validation helpers for MCP tool arguments

export function requireString(args: Record<string, unknown>, key: string): string {
  const val = args[key];
  if (typeof val !== 'string' || val.trim() === '') {
    throw new Error(`Missing or invalid required parameter: ${key}`);
  }
  return val;
}

export function requireNumber(args: Record<string, unknown>, key: string): number {
  const val = args[key];
  if (typeof val !== 'number' || Number.isNaN(val)) {
    throw new Error(`Missing or invalid required parameter: ${key}`);
  }
  return val;
}

export function requireArray(args: Record<string, unknown>, key: string): unknown[] {
  const val = args[key];
  if (!Array.isArray(val)) {
    throw new Error(`Missing or invalid required parameter: ${key} (expected array)`);
  }
  return val;
}

export function optString(args: Record<string, unknown>, key: string): string | undefined {
  const val = args[key];
  if (val === undefined || val === null) return undefined;
  if (typeof val !== 'string') return undefined;
  return val;
}

export function optNumber(args: Record<string, unknown>, key: string): number | undefined {
  const val = args[key];
  if (val === undefined || val === null) return undefined;
  if (typeof val !== 'number') return undefined;
  return val;
}

export function optBoolean(args: Record<string, unknown>, key: string): boolean | undefined {
  const val = args[key];
  if (val === undefined || val === null) return undefined;
  if (typeof val !== 'boolean') return undefined;
  return val;
}

export function optArray(args: Record<string, unknown>, key: string): unknown[] | undefined {
  const val = args[key];
  if (val === undefined || val === null) return undefined;
  if (!Array.isArray(val)) return undefined;
  return val;
}

export function requireStringArray(args: Record<string, unknown>, key: string): string[] {
  const arr = requireArray(args, key);
  if (!arr.every((v) => typeof v === 'string')) {
    throw new Error(`Parameter ${key} must be an array of strings`);
  }
  return arr as string[];
}

/** Validate that at least email or phoneNumbers is present. Returns both. */
export function requireEmailOrPhone(args: Record<string, unknown>): { email?: string; phoneNumbers?: string[] } {
  const email = optString(args, 'email');
  const phoneNumbers = optStringArray(args, 'phoneNumbers');
  if (!email && (!phoneNumbers || phoneNumbers.length === 0)) {
    throw new Error('At least one of email or phoneNumbers must be provided');
  }
  return { email, phoneNumbers };
}

export function optStringArray(args: Record<string, unknown>, key: string): string[] | undefined {
  const arr = optArray(args, key);
  if (arr === undefined) return undefined;
  if (!arr.every((v) => typeof v === 'string')) return undefined;
  return arr as string[];
}
