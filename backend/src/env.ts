const keys = ['DATABASE_URL', 'SENDGRID_API_KEY'] as const
type Key = (typeof keys)[number]

const vars: {[K in Key]?: string} = {}
for (const key of keys) {
  if (!process.env[key]) {
    throw new Error(`Missing environment variable: ${key}`)
  }
  vars[key] = process.env[key]
}

export const env = vars as Record<Key, string>
