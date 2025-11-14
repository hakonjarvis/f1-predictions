# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an F1 Predictions application built with Next.js 16 (App Router), React 19, TypeScript, Prisma ORM, and PostgreSQL. Users can submit predictions for F1 driver championship standings and compete on a leaderboard based on accuracy.

The application is in Norwegian (metadata shows `lang="no"`), so UI text and database content are primarily in Norwegian.

## Development Commands

```bash
# Start development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Prisma database commands
npx prisma generate        # Generate Prisma Client after schema changes
npx prisma migrate dev     # Create and apply migrations in development
npx prisma migrate deploy  # Apply migrations in production
npx prisma studio         # Open Prisma Studio GUI for database management
npx prisma db push        # Push schema changes without migrations (dev only)
```

## Architecture

### Database Layer (Prisma + PostgreSQL)

The data model (`prisma/schema.prisma`) represents:
- **User**: Users who make predictions (can link to Supabase auth via `authId`)
- **Team** & **Driver**: F1 teams and drivers
- **SeasonPrediction**: A user's prediction set for the season
- **DriverPrediction**: Individual driver position predictions (many per SeasonPrediction)
- **RaceResult**: Actual race results for scoring
- **ChampionshipStanding**: Current championship standings

Key relationships:
- Each User has one optional SeasonPrediction
- Each SeasonPrediction contains multiple DriverPredictions
- Drivers belong to Teams and have RaceResults

### Application Structure

**Next.js App Router** (React Server Components by default):
- `app/page.tsx`: Leaderboard page (root) - server component fetching users and calculating scores
- `app/predictions/new/page.tsx`: Drag-and-drop prediction submission UI (client component)
- `app/layout.tsx`: Root layout with Norwegian locale

**Shared Libraries**:
- `lib/prisma.ts`: Singleton Prisma Client instance with development HMR handling
- `lib/points.ts`: Points calculation logic
  - `calculatePointsForRace()`: Scores predictions vs race results (25 pts for exact, decreasing with larger diffs)
  - `calculateTotalPoints()`: Aggregates all race points for a user

### Points System

Points are awarded based on position prediction accuracy:
- Exact match: 25 points
- 1 position off: 18 points
- 2 positions off: 15 points
- Down to 8 positions off: 2 points
- 9+ positions off: 0 points

### UI Patterns

- Using **@dnd-kit** for drag-and-drop driver reordering in predictions
- Tailwind CSS for styling (v4 with PostCSS)
- Client components (marked with `"use client"`) for interactive features
- Server components for data fetching with Prisma

## Data Syncing with OpenF1 API

The app integrates with the [OpenF1 API](https://openf1.org) to fetch real F1 race data.

**OpenF1 Client** (`lib/openf1.ts`):
- `fetchDrivers(sessionKey)`: Get driver lineup for a session
- `fetchRaceSessions(year)`: Get all race sessions for a year
- `fetchSessionResults(sessionKey)`: Get final positions from a race
- `fetchLatestSession()`: Get the most recent session

**API Routes for Syncing**:
- `POST /api/sync/drivers`: Syncs all drivers and teams from latest session
- `POST /api/sync/results`: Syncs race results for a given year or session
  - Accepts JSON body: `{ year: 2025 }` or `{ sessionKey: 12345 }`

**Admin Interface**:
- `/admin/sync`: Manual data sync page with buttons to trigger syncs
- Recommended workflow:
  1. Sync drivers first to populate Driver/Team tables
  2. Sync race results to populate RaceResult table with actual race outcomes

**Data Mapping**:
- Drivers are matched by `code` (name acronym like "VER", "HAM")
- Driver `number` field stores race number (1, 33, 44, etc.)
- `RaceResult.sessionKey` links to OpenF1 session identifier
- F1 points awarded: 25, 18, 15, 12, 10, 8, 6, 4, 2, 1 for positions 1-10

## Security

**⚠️ All admin routes are protected with authentication.**

See `SECURITY.md` for complete security documentation including:
- Admin route authentication with Bearer tokens
- CORS configuration
- Rate limiting on prediction submissions
- Input validation
- Environment variable management
- Deployment security checklist

**Required environment variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `ADMIN_PASSWORD` - Password for admin routes (sync, admin panel)
- `ALLOWED_ORIGIN` - CORS origin (optional, defaults to *)

**Admin access:**
- Admin pages (`/admin/sync`, `/admin/predictions`) require password login
- Password is stored in sessionStorage for convenience
- API routes check `Authorization: Bearer <password>` header

## Important Notes

- The Prisma Client generation output is excluded via `.gitignore` (`/app/generated/prisma`)
- Prisma Client singleton pattern prevents multiple instances during hot reload
- After schema changes, run `npx prisma migrate dev` to create migrations
- Never commit the `.env` file - it contains sensitive credentials
- Use `.env.example` as a template for required variables
