const keys = [
  'NODE_ENV',
  'DATABASE_URL',
  'SENDGRID_API_KEY',
  'RATE_WINDOW_SEC',
  'RATE_LIMIT',
  'PORT',
  'ACCESS_CONTROL_ALLOW_ORIGIN',
  'SESSION_TTL_MIN',
  'HCAPTCHA_SECRET',
  'HCAPTCHA_SITE_KEY',
  'COOKIE_SECRET',
  'TRUST_PROXY',
  'LIMIT_JSON',
  'LIMIT_RAW',
  'NOTES_STORAGE_LIMIT',
] as const
type Key = (typeof keys)[number]

const vars: {[K in Key]?: string} = {}
for (const key of keys) {
  if (!process.env[key]) {
    throw new Error(`Missing environment variable: ${key}`)
  }
  vars[key] = process.env[key]
}

export const env = vars as Record<Key, string>
