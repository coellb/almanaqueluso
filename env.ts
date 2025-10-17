// Workaround for Replit Secrets bug: underscores in env var names get corrupted
// Using aliases without underscores as primary source, falling back to original names

// Smart detection: Replit sometimes swaps values even without underscores!
// We detect and auto-correct by checking key prefixes (sk_ vs pk_)
function getStripeKeys() {
  const alias1 = process.env.STRIPESECRETKEY || "";
  const alias2 = process.env.STRIPEPUBLICKEY || "";
  const orig1 = process.env.STRIPE_SECRET_KEY || "";
  const orig2 = process.env.VITE_STRIPE_PUBLIC_KEY || "";
  
  // If aliases are swapped (secret has pk_ or public has sk_), fix it
  if (alias1.startsWith('pk_') && alias2.startsWith('sk_')) {
    console.log('[ENV] 🔄 Detected swapped Stripe keys, auto-correcting...');
    return {
      secret: alias2, // Use the one with sk_
      public: alias1, // Use the one with pk_
    };
  }
  
  // If originals are swapped
  if (orig1.startsWith('pk_') && orig2.startsWith('sk_')) {
    console.log('[ENV] 🔄 Detected swapped Stripe keys in originals, auto-correcting...');
    return {
      secret: orig2,
      public: orig1,
    };
  }
  
  // Normal case: use aliases first, then originals
  return {
    secret: alias1 || orig1,
    public: alias2 || orig2,
  };
}

const stripeKeys = getStripeKeys();

export const ENV = {
  // Stripe configuration (auto-corrected if swapped)
  STRIPE_SECRET_KEY: stripeKeys.secret,
  STRIPE_PUBLIC_KEY: stripeKeys.public,
  
  // VAPID keys for push notifications
  VAPID_PUBLIC_KEY: process.env.VAPIDPUBLICKEY || process.env.VAPID_PUBLIC_KEY || "",
  VAPID_PRIVATE_KEY: process.env.VAPIDPRIVATEKEY || process.env.VAPID_PRIVATE_KEY || "",
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL || "",
  
  // JWT & Session
  JWT_SECRET: process.env.JWTSECRET || process.env.JWT_SECRET || "",
  SESSION_SECRET: process.env.SESSIONSECRET || process.env.SESSION_SECRET || "",
  
  // External APIs
  WORLDTIDES_API_KEY: process.env.WORLDTIDESAPIKEY || process.env.WORLDTIDES_API_KEY || "",
  FOOTBALL_API_KEY: process.env.FOOTBALLAPIKEY || process.env.FOOTBALL_API_KEY || "",
};

// Helper to validate required env vars
function mustHave(name: string, value: string) {
  if (!value) {
    console.warn(`⚠️  Missing environment variable: ${name}`);
  }
}

// Validate critical env vars
mustHave("DATABASE_URL", ENV.DATABASE_URL);
mustHave("JWT_SECRET", ENV.JWT_SECRET);
mustHave("SESSION_SECRET", ENV.SESSION_SECRET);

// Optional but recommended
if (!ENV.STRIPE_SECRET_KEY) {
  console.warn("⚠️  STRIPE_SECRET_KEY not configured - payment features disabled");
}

if (!ENV.VAPID_PUBLIC_KEY || !ENV.VAPID_PRIVATE_KEY) {
  console.warn("⚠️  VAPID keys not configured - push notifications disabled");
}

export default ENV;
