const SENSITIVE_KEYS = [
  'token',
  'access_token',
  'refresh_token',
  'client_secret',
  'appsecret',
  'app_secret',
  'authorization',
  'encryption_key',
  'password',
  'code_verifier'
];

function maskString(val) {
  if (typeof val !== 'string') return val;
  if (val.length <= 8) return '***';
  return val.slice(0, 4) + '...' + val.slice(-4);
}

export function redactObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map((item) => redactObject(item));

  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_KEYS.some((s) => lowerKey.includes(s));
    if (isSensitive) {
      clean[key] = typeof value === 'string' ? maskString(value) : '***';
    } else if (value && typeof value === 'object') {
      clean[key] = redactObject(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

export const logger = {
  info(message, meta = {}) {
    console.log(JSON.stringify({ level: 'INFO', timestamp: new Date().toISOString(), message, ...redactObject(meta) }));
  },
  warn(message, meta = {}) {
    console.warn(JSON.stringify({ level: 'WARN', timestamp: new Date().toISOString(), message, ...redactObject(meta) }));
  },
  error(message, meta = {}) {
    console.error(JSON.stringify({ level: 'ERROR', timestamp: new Date().toISOString(), message, ...redactObject(meta) }));
  },
  debug(message, meta = {}) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(JSON.stringify({ level: 'DEBUG', timestamp: new Date().toISOString(), message, ...redactObject(meta) }));
    }
  }
};
