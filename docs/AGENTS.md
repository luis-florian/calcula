# AGENTS.md

# Amorta

Amorta is a simple financing and payment-tracking application.

The primary user is an older adult with very limited experience using
computers and software.

The product must remain simple, predictable, and easy to understand.

---

## 1. Source of truth

Before implementing a task, read the relevant documentation in `/docs`.

Documents:

- `docs/01-product.md`
  Product definition, scope, financial rules, and business requirements.

- `docs/02-ux.md`
  User flows, screens, wording, and UX requirements.

- `docs/03-data.md`
  Data model, persistence rules, and historical data requirements.

- `docs/04-architecture.md`
  Technical architecture, security, testing, and implementation constraints.

- `docs/05-implementation.md`
  Implementation phases, tasks, checkpoints, and acceptance criteria.

Do not duplicate these specifications in this file.

If documentation and implementation disagree, report the discrepancy before
changing behavior.

---

## 2. Work one task at a time

Implement only the requested task from `docs/05-implementation.md`.

Do not automatically implement:

- future tasks;
- speculative improvements;
- unrelated refactors;
- additional product features.

Keep changes small and reviewable.

Before coding:

1. Read this file.
2. Read the relevant documentation.
3. Inspect the existing implementation.
4. Identify dependencies and affected code.
5. Produce a concise implementation plan.

Then implement the requested task.

---

## 3. Do not invent business rules

Financial behavior must come from the documented requirements.

If a financial or business rule is ambiguous, missing, or contradictory:

1. Do not guess.
2. Do not silently choose a behavior.
3. Report the ambiguity clearly.
4. Continue only with work that does not depend on that decision.

Examples include:

- payments smaller than accrued interest;
- final-payment behavior;
- rounding rules;
- payment-date edge cases;
- changes to an existing financing agreement.

---

## 4. Financial calculations are critical

All financial calculations must use the shared Financial Engine.

Do not duplicate financial formulas in:

- React components;
- Server Actions;
- API handlers;
- database queries;
- formatting utilities.

The UI must never be the source of truth for financial calculations.

Final calculations must be performed server-side.

Do not trust calculated values sent by the client.

---

## 5. Money

Never use floating-point arithmetic for financial calculations.

Use the project's decimal strategy for money and interest calculations.

PostgreSQL monetary values must use exact numeric types.

Rounding behavior must be centralized and consistent.

Do not introduce a new rounding strategy without updating the specification
and tests.

---

## 6. Dates

Financial dates represent calendar dates, not moments in time.

Use date-only semantics when time-of-day is irrelevant.

Do not introduce timezone-dependent behavior into interest calculations.

Interest periods must be calculated using the documented day-count rules.

---

## 7. Payment history

Confirmed payments are historical financial records.

Never silently delete or overwrite payment history.

Corrections must follow the documented correction strategy.

A change to an earlier payment may require recalculation of all subsequent
financial state.

Preserving explainability of the current balance is more important than
implementation convenience.

---

## 8. Database consistency

Operations that modify multiple related financial records must be atomic.

For example, registering a payment must not leave:

- a Payment without the corresponding Financing balance update; or
- an updated Financing balance without its Payment.

Use database transactions where required.

Never rely on client-side state as the authoritative current balance.

---

## 9. UX

The primary user has limited experience with software.

Prefer:

- obvious actions;
- large touch targets;
- readable typography;
- simple language;
- one primary action per screen;
- explicit confirmation for important actions;
- clear success and error feedback.

Avoid:

- technical terminology;
- hidden interactions;
- unnecessary settings;
- dense dashboards;
- complex navigation;
- unexplained icons.

Do not add complexity merely because it is common in financial software.

If a feature can be simpler without losing required behavior, prefer the
simpler solution.

---

## 10. Architecture

Amorta is intentionally a small web application.

Follow the architecture defined in `docs/04-architecture.md`.

Do not introduce infrastructure or architectural patterns without a concrete
requirement.

In particular, do not introduce technologies such as:

- microservices;
- message brokers;
- event sourcing;
- CQRS;
- Redis;
- GraphQL;
- Kubernetes;
- a separate backend application;

unless the architecture documentation is explicitly changed first.

Prefer boring, understandable solutions.

---

## 11. Testing

Financial behavior requires automated tests.

When changing financial calculations, include tests for:

- normal cases;
- boundary conditions;
- rounding;
- relevant date behavior;
- failure conditions.

A financial feature is not complete without tests.

For application behavior, add tests proportional to the risk of the change.

Critical user flows should be covered by E2E tests where specified in
`docs/05-implementation.md`.

---

## 12. Security

Never commit:

- passwords;
- API keys;
- database credentials;
- authentication secrets;
- production tokens.

Use environment variables.

Never expose server-only secrets to client-side code.

Never trust IDs, balances, interest values, or ownership information supplied
by the browser without server-side validation.

Every protected Financing operation must verify ownership.

---

## 13. Error handling

Internal errors may be technical.

User-facing errors must be understandable.

Never expose raw:

- database errors;
- stack traces;
- validation internals;
- framework errors;

to the user.

Convert expected domain errors into clear user-facing messages.

---

## 14. Scope discipline

Do not implement a feature simply because it may be useful later.

Features outside the current MVP remain outside the implementation until
explicitly requested.

Examples:

- late-payment penalties;
- advanced reporting;
- invoices;
- notifications;
- multiple payment frequencies;
- offline synchronization;
- document attachments;
- complex customer management;
- accounting modules.

Do not prematurely generalize the system for hypothetical future requirements.

---

## 15. Code quality

Prefer:

- small functions;
- descriptive names;
- explicit domain concepts;
- simple control flow;
- strong TypeScript types;
- reusable domain logic.

Avoid:

- unnecessary abstractions;
- speculative generic frameworks;
- large components;
- duplicated business logic;
- clever code that reduces readability.

Comments should explain WHY when the reason is not obvious.

Do not use comments to explain code that can be made self-explanatory.

---

## 16. Before finishing a task

Run the checks relevant to the project, including:

- tests;
- type checking;
- lint;
- build when appropriate.

Verify the acceptance criteria from `docs/05-implementation.md`.

Then report:

1. What was implemented.
2. Important files changed.
3. Tests/checks executed and their results.
4. Any assumptions made.
5. Any unresolved questions or specification conflicts.
6. The next task according to `docs/05-implementation.md`.

Do not start the next task automatically.

---

## 17. Definition of Done

A task is complete only when:

- its acceptance criteria are satisfied;
- relevant tests pass;
- TypeScript checks pass;
- lint passes;
- existing behavior remains healthy;
- no unrelated scope was added;
- no secrets were introduced;
- documentation and implementation remain consistent.

Financial changes additionally require automated financial tests.
