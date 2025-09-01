# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Quick Start & Development Commands

### Primary Development Commands
```bash
# Start development server with Turbopack
npm run dev

# Build for production with Turbopack
npm run build

# Start production server
npm run start

# Run ESLint
npm run lint

# Format code with Prettier
npm run format
```

### Testing & Database Management
```bash
# Test Supabase connection and table structure
node scripts/test-connection.js

# Test complete app functionality with sample data
node scripts/test-app.js

# Test database with rental_invoices table
node scripts/test-database.js

# Setup or migrate database (if needed)
node scripts/setup-database.js

# Type checking
npx tsc --noEmit
```

### Additional Useful Commands
```bash
# Add shadcn/ui components
npx shadcn@latest add <component-name>

# Supabase CLI commands (if supabase installed)
npx supabase start
npx supabase db reset
npx supabase gen types typescript --local

# Generate database types from remote Supabase
npx supabase gen types typescript --project-id=YOUR_PROJECT_ID
```

## Architecture Overview

This is a **Next.js 15 App Router** application built for rental property management with the following stack:

### Core Technologies
- **Next.js 15** with App Router and Turbopack
- **React 19** with TypeScript support
- **Tailwind CSS 4** with CSS variables theming
- **shadcn/ui** components built on Radix UI primitives
- **Supabase** for database and authentication (SSR-enabled)

### Key Dependencies
- **@hookform/resolvers** - Form validation resolver for Zod schemas
- **date-fns** - Modern JavaScript date utility library for date formatting
- **html2canvas** - Screenshot library for capturing DOM elements as images
- **jspdf** - Client-side PDF generation library
- **lucide-react** - Beautiful & consistent icon toolkit
- **next-themes** - Perfect theme switching for Next.js
- **puppeteer** - Headless Chrome API for server-side PDF generation
- **react-day-picker** - Flexible date picker component for React
- **react-hook-form** - Performant, flexible forms with easy validation
- **sonner** - Opinionated toast component for React
- **zod** - TypeScript-first schema declaration and validation library

### Directory Structure
```
src/
├── app/                         # Next.js App Router pages and API routes
│   ├── layout.tsx              # Root layout with theme provider
│   ├── page.tsx                # Dashboard homepage
│   ├── globals.css             # Global styles and CSS variables
│   ├── admin/                  # Admin management pages
│   ├── auth/                   # Authentication pages
│   │   ├── login/
│   │   ├── signup/
│   │   ├── callback/
│   │   └── forgot-password/
│   ├── api/                    # API routes for server actions
│   │   ├── admin/              # Admin operations (seed, clear)
│   │   ├── invoices/           # Invoice management APIs
│   │   ├── receipts/           # Receipt generation APIs
│   │   └── rooms/              # Room-specific APIs
│   ├── properties/
│   │   └── [id]/
│   │       └── utilities/      # Property utility management
│   ├── rooms/
│   │   └── [id]/
│   │       └── utilities/      # Room utility management
│   ├── tenants/
│   │   └── [id]/              # Dynamic tenant detail pages
│   ├── invoices/               # Invoice management
│   ├── receipts/               # Receipt management
│   └── profile/                # User profile pages
├── components/
│   ├── ui/                     # shadcn/ui base components
│   ├── common/                 # Shared common components
│   ├── dashboard/              # Dashboard-specific components
│   ├── properties/             # Property management components
│   ├── rooms/                  # Room management components
│   ├── tenants/               # Tenant management components
│   ├── invoices/              # Invoice components
│   ├── receipts/              # Receipt components
│   ├── forms/                 # Reusable form components
│   └── utilities/             # Utility management components
├── contexts/                   # React context providers
│   ├── auth-context.tsx       # Authentication context
│   └── AuthContext.tsx        # Legacy auth context
├── lib/
│   ├── supabase/              # Supabase configuration
│   │   └── client.ts          # Browser and server clients
│   └── utils.ts               # Utility functions (cn, etc.)
├── scripts/                   # Development and setup scripts
├── styles/                    # Additional styling files
├── types/
│   ├── index.ts               # Basic type definitions
│   ├── database.ts            # Complete database types
│   ├── supabase.ts           # Supabase-specific types
│   └── globals.d.ts          # Global type declarations
└── middleware.ts              # Authentication middleware
```

### Key Architectural Patterns

**Authentication & Authorization:**
- Supabase Auth with email/password authentication
- Row Level Security (RLS) policies on database tables
- Server-side authentication via middleware (`src/middleware.ts`)
- Protected routes automatically redirect unauthenticated users
- Context providers for auth state management

**Forms & Validation:**
- React Hook Form for performant form handling
- Zod schemas for runtime type validation
- Custom form components with consistent error handling
- Integration with shadcn/ui form primitives

**Real-time Data:**
- Supabase real-time subscriptions for live updates
- Context providers manage subscription lifecycle
- Automatic UI updates when database changes occur
- Optimistic updates for better user experience

**PDF & Document Generation:**
- jsPDF for client-side PDF generation
- html2canvas for screenshot-based PDF creation
- Puppeteer for server-side PDF rendering (API routes)
- Template-based invoice and receipt generation
- Custom styling for professional document output

**Theming System:**
- next-themes for dark/light mode switching
- CSS variables defined in `globals.css` for theming
- `cn()` utility function combines `clsx` and `tailwind-merge`
- Geist Sans and Mono fonts loaded via `next/font/google`
- Consistent color scheme across all components

**Database Layer:**
- Supabase client configured with fallback placeholder values
- `isSupabaseConfigured()` helper checks for proper environment setup
- SSR support via `@supabase/ssr` package
- Service role key for admin operations
- Automatic database migrations via custom scripts

**Component System:**
- shadcn/ui components use `cva` (Class Variance Authority) for variants
- Radix UI primitives provide accessibility
- Components support `asChild` pattern for composition
- Reusable form components with validation
- Modular feature-based component organization

## Configuration & Environment

### Required Environment Variables
Create `.env.local` with:
```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
# Optional: For admin operations and database migrations
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Key Configuration Files

**Tailwind CSS (`tailwind.config.ts`):**
- Uses CSS variables for colors (e.g., `hsl(var(--background))`)
- Custom font family variables
- Includes `tailwindcss-animate` plugin

**shadcn/ui (`components.json`):**
- Style: "new-york"
- Base color: "neutral" 
- CSS variables enabled
- Path aliases configured for imports

**ESLint (`eslint.config.mjs`):**
- Flat config format
- Extends Next.js core web vitals, TypeScript, and Prettier
- Ignores build directories

### Import Aliases
- `@/components` → `src/components`
- `@/lib` → `src/lib`
- `@/` → `src/`

## Development Guidelines

### Adding New Components
1. Use shadcn/ui CLI: `npx shadcn@latest add <component>`
2. Components go in `src/components/ui/`
3. Follow existing patterns with `cva` for variants

### Database Integration
1. Set up Supabase project and add credentials to `.env.local`
2. Generate TypeScript types: `supabase gen types typescript`
3. Use the configured client from `@/lib/supabase/client`

### Type Definitions
- Add shared types to `src/types/index.ts`
- Current types include `User` and `Property` interfaces
- Follow the established naming conventions

## Supabase Setup Notes
The app includes connection testing on the homepage that gracefully handles:
- Missing environment variables (shows warning)
- Database connection errors
- Unconfigured Supabase projects

The connection test attempts to query `_realtime_schema` as a health check.
