# Copilot Instructions for BTS Booking Project

## Project Overview

**bts-booking-project** is a Next.js application for managing Bangkok Mass Transit System (BTS) ticket bookings. The system handles:
- Multiple BTS stations (E-line, N-line, S-line, CEN)
- Reusable travel cards with balance tracking
- Dynamic fare calculations based on origin/destination and trip type (one-way vs round)
- 12-hour hold period for bookings

## Critical Next.js Version Notice

⚠️ **This project uses Next.js 16.2.6, which has breaking changes from your training data.** 
- APIs, conventions, and file structure may differ significantly
- Before writing any code, read relevant guides in `node_modules/next/dist/docs/`
- Heed deprecation notices and check [Next.js changelog](https://nextjs.org/docs/upgrade-guide)

## Tech Stack & Versions

- **Next.js**: 16.2.6 (App Router)
- **React**: 19.2.4
- **TypeScript**: ^5 (strict mode enabled)
- **Tailwind CSS**: ^4 (via @tailwindcss/postcss)
- **ESLint**: ^9 (with Next.js core web vitals config)
- **Node target**: ES2017

### Configuration Files
- `tsconfig.json`: Path alias `@/*` maps to workspace root
- `eslint.config.mjs`: ESM format using defineConfig with Next.js core vitals + TypeScript presets
- `postcss.config.mjs`: Tailwind CSS 4 with PostCSS integration

## Project Structure & Architecture

```
app/
  ├── layout.tsx       # Root layout with metadata, Geist font, Tailwind classes
  ├── page.tsx         # Main booking page (339 lines) - contains all business logic
  └── globals.css      # Global styles including Tailwind
public/               # Static assets
```

### Key Architectural Patterns

1. **Data-Driven Constants** (in `page.tsx`):
   - `stations`: Array of BTS station objects with id and name
   - `initialCards`: Mock card inventory with balance and status
   - `fareTable`: Fare rules for known routes
   - `HOLD_HOURS`: 12-hour hold period constant

2. **Fallback Logic for Fares**:
   - Explicit fare table lookup used first
   - `fallbackFare()` function calculates estimated fares for unmapped routes:
     - Extracts numeric station IDs (E4 → 4, E23 → 23, S6 → 6)
     - Base fare: 17 + (station difference × 3)
     - Cross-line penalty: +10 baht when lines differ
     - Round trip: double the one-way fare
     - Cap: 65 baht maximum per trip

3. **Utility Functions**:
   - `stationLabel(id)`: Formats station display as "ID - Name" (e.g., "E4 - Asok")

## Development Workflow

### Available Commands

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build
npm start        # Run production server
npm run lint     # Run ESLint
```

### Development Patterns

- **Hot reload**: Modify files in `app/` for automatic page updates
- **Fonts**: `next/font` automatically optimizes Geist fonts (use CSS variables if extending)
- **Styling**: Use Tailwind utility classes throughout components (see `layout.tsx` for examples)
- **TypeScript**: Strict mode enabled; use `Readonly<>` for prop type safety

## Code Conventions

1. **Component Structure**: 
   - Use `import React` when managing state (useState, useMemo)
   - Functional components with TypeScript types
   - Props passed as destructured parameters with `Readonly<{...}>`

2. **Naming**:
   - Constants in UPPER_CASE (HOLD_HOURS, stations, initialCards)
   - Functions in camelCase (stationLabel, fallbackFare)
   - Component files: PascalCase (Page, Layout)

3. **Imports**:
   - Next.js metadata: `import type { Metadata } from "next"`
   - Font handling: `import { Geist, Geist_Mono } from "next/font/google"`
   - Always specify `import type` for TypeScript-only imports

## Domain-Specific Knowledge

### BTS Stations Reference
Current system handles 12 stations across 4 lines:
- **E-line**: E4 (Asok), E5 (Phrom Phong), E7 (Ekkamai), E23 (Kheha)
- **N-line**: N1 (Ratchathewi), N8 (Mo Chit), N24 (Khu Khot)
- **S-line**: S2 (Sala Daeng), S3 (Chong Nonsi), S6 (Saphan Taksin), S12 (Bang Wa)
- **CEN**: Central (Siam) - treated as cross-line hub

### Card System
- Each card has: id (BTS-001 format), balance (baht), status (Available)
- Bookings hold cards for 12 hours
- Multiple cards can be managed by the same user

### Fare Rules
- Lookup table drives fare calculation for exact routes
- Fallback algorithm ensures all route pairs have an estimate
- Trip types: "oneway" and "round"
- Base calculation: station index differences + line crossing penalties

## When Adding Features

1. **New Routes**: Add to `fareTable` array in `page.tsx` or ensure fallback covers it
2. **New Stations**: Update `stations` array AND any hardcoded line checks in fallback logic
3. **New UI Components**: 
   - Import from `next/*` for server utilities
   - Use Tailwind CSS for styling (see root layout for class patterns)
   - Test in dev server with hot reload
4. **Testing Changes**: Run `npm run lint` before committing to catch TypeScript/ESLint issues

## Key Files to Reference

- [app/page.tsx](app/page.tsx) - Main booking logic and state management
- [app/layout.tsx](app/layout.tsx) - Root layout pattern with metadata
- [package.json](package.json) - Dependency versions and build scripts
- [tsconfig.json](tsconfig.json) - Path aliases and TypeScript compilation settings
