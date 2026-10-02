# Security decisions

## Authentication provider

Production authentication uses Auth.js / NextAuth with a Credentials provider.

Reasoning:

- compatible with Next.js and Vercel;
- supports persistent sessions;
- allows a simple custom login screen;
- is configured without public registration;
- lets Amorta start with one allowed user and later grow without changing the
  financing ownership model;
- keeps the password out of the database schema and source code by storing only
  a bcrypt hash in environment variables.

Amorta uses a server-only authentication boundary in `src/lib/auth.ts`. It reads
the Auth.js session and returns the stable configured owner id from
`AMORTA_SINGLE_USER_ID`, defaulting to `dev_user`. Routes and server actions are
coded against an authenticated user instead of hardcoded owner ids.

## Phase 8 security review

- Secrets stay in environment variables: `DATABASE_URL`, `AUTH_SECRET`,
  `AMORTA_LOGIN_PASSWORD_HASH`, and `AMORTA_SINGLE_USER_ID`.
- Server-only auth logic is isolated in `src/lib/auth.ts`.
- Client components do not receive secrets or owner ids from the browser.
- Private routes and Server Actions call `requireAuthenticatedUser()` before
  reading or mutating financing data.
- Financing reads and writes keep using `financingId + ownerId` checks instead
  of trusting IDs by themselves.
- Neon development, preview, and production database URLs still need to remain
  separate during the final deployment setup.
