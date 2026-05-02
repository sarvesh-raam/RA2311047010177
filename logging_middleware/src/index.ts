import axios from 'axios';

const API_BASE = 'http://20.207.122.201/evaluation-service';

type Stack = 'backend' | 'frontend';
type Level = 'debug' | 'info' | 'warn' | 'error' | 'fatal';
type Package =
  | 'cache' | 'controller' | 'cron_job' | 'dh' | 'domain'
  | 'handler' | 'repository' | 'route' | 'service'
  | 'api' | 'component' | 'hook' | 'page' | 'state' | 'style'
  | 'auth' | 'config' | 'middleware' | 'utils';

interface LoggerConfig {
  email: string;
  name: string;
  rollNo: string;
  accessCode: string;
  clientID: string;
  clientSecret: string;
}

let config: LoggerConfig | null = null;
let cachedToken: string | null = null;
let tokenExpiry = 0;

export function initLogger(cfg: LoggerConfig) {
  config = cfg;
}

async function fetchToken(): Promise<string> {
  if (!config) throw new Error('Logger not initialized. Call initLogger() first.');

  const res = await axios.post(`${API_BASE}/auth`, {
    email: config.email,
    name: config.name,
    rollNo: config.rollNo,
    accessCode: config.accessCode,
    clientID: config.clientID,
    clientSecret: config.clientSecret,
  });

  cachedToken = res.data.access_token;
  tokenExpiry = res.data.expires_in;
  return cachedToken!;
}

async function getToken(): Promise<string> {
  const nowSeconds = Math.floor(Date.now() / 1000);
  // refresh if expired or about to expire in 60s
  if (!cachedToken || nowSeconds >= tokenExpiry - 60) {
    await fetchToken();
  }
  return cachedToken!;
}

export async function Log(
  stack: Stack,
  level: Level,
  pkg: Package,
  message: string
): Promise<void> {
  try {
    const token = await getToken();
    await axios.post(
      `${API_BASE}/logs`,
      { stack, level, package: pkg, message },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  } catch (err: any) {
    // TODO: retry logic
  }
}
