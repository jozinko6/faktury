# Stack decision for MVP runtime

This document records the first runtime stack decision. It is intentionally small and reversible enough for the current repository state: the repository still contains contracts, fixtures, and documentation, but no application runtime.

## Decision

Use a TypeScript web application stack for MVP 1.0:

- **Application:** Next.js with App Router
- **Language:** TypeScript
- **Database:** SQLite for the first local MVP runtime
- **ORM / migrations:** Prisma
- **Validation:** JSON Schema contracts kept as source-of-truth references, with runtime validators added only when the app skeleton exists
- **Tests:** Start with contract and domain tests before end-to-end UI tests

## Why this fits MVP 1.0

The MVP needs one coherent web app for:

- organization setup,
- partners,
- draft invoice creation,
- invoice issue flow,
- PDF and hash metadata,
- CSV bank import,
- payment matching confirmation,
- expense inbox,
- monthly accountant export,
- audit log.

Next.js keeps the first product loop simple because UI, server actions/API routes, and generated files can live in one app while the project is still small. TypeScript fits the existing JSON contracts well. SQLite keeps local development low-friction before production hosting and database choices are finalized.

## Boundaries

This decision does not yet introduce:

- authentication,
- production database provisioning,
- billing,
- PSD2 bank APIs,
- XML tax submissions,
- eKasa,
- OCR as a required dependency,
- full double-entry accounting as the primary runtime mode.

## First runtime slice

The first implementation slice should stay narrow:

1. Bootstrap a minimal Next.js + TypeScript app.
2. Add a local database schema for organization, business partner, invoice, invoice item, and audit event.
3. Seed the runtime from the existing fixtures.
4. Implement a draft invoice flow without assigning an invoice number.
5. Keep issue/PDF/bank/export as later slices.

## Verification target

The first runtime slice is ready when:

- the app starts locally,
- fixtures can be loaded or mirrored as seed data,
- a draft invoice can exist without `number`,
- tests still pass with the existing contract harness,
- no MVP boundary is crossed accidentally.
