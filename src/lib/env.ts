/**
 * Runtime environment variable validation.
 * Fails fast on missing required vars instead of silent undefined errors.
 */

type EnvVar = {
  key: string;
  required: boolean;
  public: boolean; // NEXT_PUBLIC_ prefixed — available client-side
};

const ENV_VARS: EnvVar[] = [
  // Supabase
  { key: "NEXT_PUBLIC_SUPABASE_URL", required: true, public: true },
  { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", required: true, public: true },
  { key: "SUPABASE_SERVICE_ROLE_KEY", required: true, public: false },

  // Stripe
  { key: "STRIPE_SECRET_KEY", required: false, public: false },
  { key: "STRIPE_WEBHOOK_SECRET", required: false, public: false },
  { key: "NEXT_PUBLIC_STRIPE_PRO_PRICE_ID", required: false, public: true },
  { key: "NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID", required: false, public: true },

  // DigitalOcean
  { key: "DO_API_TOKEN", required: false, public: false },
  { key: "DO_SSH_PUBLIC_KEY", required: false, public: false },

  // Cloudflare
  { key: "CLOUDFLARE_API_TOKEN", required: false, public: false },
  { key: "CLOUDFLARE_ZONE_ID", required: false, public: false },
  { key: "CLOUDFLARE_SAAS_ID", required: false, public: false },

  // Mapbox
  { key: "NEXT_PUBLIC_MAPBOX_TOKEN", required: false, public: true },

  // ElasticEmail
  { key: "ELASTICEMAIL_API_KEY", required: false, public: false },
];

interface EnvStatus {
  valid: boolean;
  missing: string[];
  present: string[];
}

/**
 * Validate environment variables at runtime.
 * Call this on server startup or in middleware.
 * Only checks server-side vars (public: false) — client vars must exist at build time.
 */
export function validateEnv(): EnvStatus {
  const missing: string[] = [];
  const present: string[] = [];

  for (const v of ENV_VARS) {
    if (!v.public && v.required && !process.env[v.key]) {
      missing.push(v.key);
    } else if (!v.public && process.env[v.key]) {
      present.push(v.key);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    present,
  };
}

/**
 * Get a required env var, throwing if missing.
 * Use this instead of raw process.env.FOO! to get meaningful errors.
 */
export function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return val;
}
