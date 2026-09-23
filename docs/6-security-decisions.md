# Security decisions

## Authentication provider

Production authentication will use Auth.js / NextAuth.

Reasoning:

- compatible with Next.js and Vercel;
- supports persistent sessions;
- allows a simple custom login screen;
- can be configured without public registration;
- lets Amorta start with one allowed user and later grow without changing the
  financing ownership model.

For the current local implementation, Amorta uses a server-only authentication
boundary in `src/lib/auth.ts`. It returns the configured single user id from
`AMORTA_SINGLE_USER_ID`, defaulting to `dev_user`. This keeps all routes and
server actions coded against an authenticated user instead of hardcoded owner
ids, while postponing real provider credentials and database-backed auth setup
until production configuration.

## Phase 8 security review

- Secrets stay in environment variables: `DATABASE_URL`, `AUTH_SECRET`, and
  `AMORTA_SINGLE_USER_ID`.
- Server-only auth logic is isolated in `src/lib/auth.ts`.
- Client components do not receive secrets or owner ids from the browser.
- Private routes and Server Actions call `requireAuthenticatedUser()` before
  reading or mutating financing data.
- Financing reads and writes keep using `financingId + ownerId` checks instead
  of trusting IDs by themselves.
- Neon development, preview, and production database URLs still need to remain
  separate during the final deployment setup.
