const LOCAL_ORIGINS = ['http://localhost:3000', 'http://localhost:3001'];

function configuredOrigins(): string[] {
  const configured = (process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  return Array.from(new Set([...configured, ...LOCAL_ORIGINS]));
}

export function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true;
  if (configuredOrigins().includes(origin)) return true;
  if (process.env.DEMO_MODE !== 'true') return false;
  try {
    const host = new URL(origin).hostname;
    return host === 'localhost' || host.endsWith('.vercel.app');
  } catch {
    return false;
  }
}

export function corsOriginCallback(
  origin: string | undefined,
  callback: (error: Error | null, allow?: boolean) => void,
): void {
  callback(null, isAllowedOrigin(origin));
}
