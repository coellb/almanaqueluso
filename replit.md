# AlmanaqueLuso - Portuguese Cultural Calendar

## Overview
AlmanaqueLuso is a full-stack Portuguese cultural calendar application that unifies astronomy events, lunar phases, tides, sports matches (Liga Portugal, UEFA, FIFA), and Portuguese cultural events. It features user authentication, personalized preferences, and a culturally-inspired design drawing from Portuguese azulejo tiles and Apple Calendar aesthetics. The project aims to provide a comprehensive and culturally rich calendar experience for Portuguese users and those interested in Portuguese culture, with ambitions for internationalization and expansion into related cultural and agricultural domains.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework & Build Tool**: React 18 with TypeScript, Vite.
- **UI Component System**: shadcn/ui (built on Radix UI), Tailwind CSS, Class Variance Authority (CVA).
- **State Management**: Zustand (global auth state), TanStack Query (server state, caching), React Hook Form with Zod validation.
- **Design System**: Custom color palette inspired by Portuguese azulejo tiles, light/dark mode, Portuguese typography (Inter, Playfair Display), culturally-inspired visual hierarchy.
- **Internationalization**: react-i18next with i18next-browser-languagedetector for multi-language support (Portuguese, English, French).

### Backend Architecture
- **Server Framework**: Express.js with TypeScript.
- **Authentication & Security**: JWT (jsonwebtoken) for stateless authentication, bcrypt for password hashing, custom authentication middleware.
- **Database Layer**: Drizzle ORM for type-safe operations, Neon Serverless PostgreSQL.
- **API Design**: RESTful endpoints for various data categories (auth, events, preferences, astronomy, agriculture, culture, wisdom), consistent error handling.
- **Job Scheduling**: node-cron for automated notifications - daily digest (every 15 min), immediate notifications (every 15 min), tide imports (daily 02:00 UTC), football imports (daily 03:00 UTC).
- **Push Notifications**: Web Push API with VAPID authentication, web-push library for cross-browser support.
- **Health Monitoring & Rate Limiting**: `/api/health` endpoint, express-rate-limit.

### Data Architecture
- **Database Schema**:
    - **Users Table**: Serial ID, unique email, password hash, timezone support, role-based access, timestamps, Stripe subscription details.
    - **Events Table**: Polymorphic event types (astronomy, sports, cultural, user-created), temporal data, geographic filtering, JSONB for metadata, tag-based categorization, source tracking.
    - **Preferences Table**: One-to-one with users, event type filtering, daily digest configuration, notification preferences.
    - **Push Subscriptions Table**: Web Push API subscriptions (endpoint, p256dh/auth keys), linked to users for multi-device support.
    - **Notification Preferences Table**: Granular controls per notification type (enabled flags, frequency: immediate/daily/weekly), preferred notification time, quiet hours configuration.
- **Data Relationships**: Users → Events (one-to-many), Users → Preferences (one-to-one), Users → Push Subscriptions (one-to-many), Users → Notification Preferences (one-to-one).

### Feature Specifications
- **Complete Astronomy & Calendar System**: Sun/moon times, lunar phases, eclipses, seasonal events, zodiac, constellations, Portuguese holidays, historical ephemerides.
- **Agriculture & Nature System**: Monthly agricultural calendar, pruning/grafting, vineyards/olive groves care, gardening, livestock care, beekeeping, lunar influence on agriculture, weather practices.
- **Society & Culture System**: Symbolic weather predictions, rural Portuguese poetry, scientific curiosities, agricultural regions map, daily astrology influences.
- **Portuguese Wisdom & Customs System**: Monthly proverbs, saints calendar, traditional recipes, folk traditions, popular superstitions.
- **Payment & Subscription System**: Stripe integration for one-time €0.99 lifetime premium access. MB WAY (Multibanco) requires activation in Stripe Dashboard.
- **Push Notification System**: Cross-browser web push notifications with granular user controls - per-type enable/disable (tides, sports, astronomy, agriculture, cultural, holidays), frequency selection (immediate, daily digest, weekly digest), preferred notification time, quiet hours configuration. Automated schedulers respect user preferences and time zones.

## External Dependencies

- **Database & Infrastructure**: Neon Serverless PostgreSQL, Drizzle Kit.
- **Authentication & Security**: jsonwebtoken, bcrypt.
- **UI Component Libraries**: Radix UI, shadcn/ui, Lucide React.
- **Utility Libraries**: date-fns, clsx, tailwind-merge, nanoid.
- **Development Tools**: Replit-specific plugins, TSX, esbuild.
- **Design & Styling**: Tailwind CSS, PostCSS, Autoprefixer, Google Fonts (Inter, Playfair Display).
- **Payment Gateway**: Stripe.
- **i18n**: react-i18next, i18next-browser-languagedetector.
- **Astronomical Data**: sunrise-sunset.org API, SunCalc library, USNO API (for lunar phases).
- **Push Notifications**: web-push (VAPID-based Web Push API), Service Worker API.

## Recent Implementation Notes (October 2025)

### Push Notification System (October 2025 - ACTIVE ✅)
- **VAPID Keys**: Hardcoded in `server/services/pushNotificationService.ts` due to Replit Secrets issues. Current valid keys:
  - Public: `BD58hkgWvX5JcQAkLosAmWc1YMCsYcKKG0Z5e1H98PQ2YeE3kxVVljuBkgUNu4s6ocGbBaAQ4ldR6MwuoFlV7C8` (87 chars, 65 bytes decoded)
  - Private: `pTXiOx3tPdavzlwR3FLrJd2yg9FgzwPyWr7Ctl3w9YA` (43 chars)
  - Generated with: `npx web-push generate-vapid-keys`
  - Note: Regenerating requires ALL users to re-subscribe
- **Scheduler Logic**: Runs every 15 minutes. Daily digest sends in a 15-minute window starting at user's preferred time (prevents duplicates). Immediate notifications check for upcoming events (e.g., tides within 2 hours).
- **User Preferences**: Granular controls per notification type (tides, sports, astronomy, agriculture, cultural, holidays), frequency settings (immediate/daily/weekly), preferred notification time, quiet hours support.
- **Multi-device Support**: Users can subscribe multiple devices, all tracked in pushSubscriptions table.
- **Status**: Fully functional and architect-approved ✅

### One-Time Payment System (October 2025 - WORKAROUND IMPLEMENTED ✅)
- **Payment Model**: €0.99 one-time payment for lifetime premium access (replaces subscription model)
- **Stripe Integration**: PaymentIntent-based flow with Stripe Elements for secure card payments
- **Frontend Flow**: 
  - `/pricing` - Shows lifetime offer card for non-premium users
  - `/payment` - Stripe PaymentElement with secure iframe for card details
  - `/dashboard?payment=success` - Success redirect after payment completion
- **Backend Endpoints**:
  - `POST /api/payment/create` - Creates PaymentIntent, returns clientSecret
  - `GET /api/payment/info` - Returns payment details (€0.99, features list)
  - `GET /api/_diagnostics/env` - Validates environment variables (development only)
- **Replit Secrets Bug - WORKAROUND IMPLEMENTED**: 
  - **Bug**: Replit Secrets corrupts variables with underscores - keys return values from OTHER variables (EVEN without underscores!)
  - **Solution**: Created `server/env.ts` with TWO protection layers:
    1. **Cascade fallback system** - Tries aliases without underscores first
    2. **Auto-correction logic** - Detects and fixes swapped keys by prefix (`sk_` vs `pk_`)
  - **Auto-Correction**: System automatically detects when Stripe keys are swapped and corrects them (logs: `[ENV] 🔄 Detected swapped Stripe keys, auto-correcting...`)
  - **Aliases**: Use secrets without underscores (STRIPESECRETKEY, STRIPEPUBLICKEY, etc.)
  - **Setup Guide**: See `SETUP_SECRETS.md` for complete configuration instructions
  - **Validation**: Use `/api/_diagnostics/env` to verify secrets are loaded correctly (development-only)
  - **Security**: Never hardcode sensitive keys in source code
- **MB WAY/Multibanco Support**: Requires manual activation at https://dashboard.stripe.com/settings/payment_methods
- **Status**: Workaround functional, requires secret configuration per SETUP_SECRETS.md