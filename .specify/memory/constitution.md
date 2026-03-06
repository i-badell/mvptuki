<!--
SYNC IMPACT REPORT
==================
Version change: 1.0.0 → 2.0.0
Bump type: MAJOR — backward-incompatible platform redefinition (Next.js/React → Nuxt/Vue).
  All existing code targeting React/Next.js APIs is invalidated by this change.

Modified principles:
  III. Component Architecture
    OLD: "UI MUST be built from reusable, independently renderable React components.
         React Server Components (RSC) are the default; 'use client' for interactivity."
    NEW: "UI MUST be built from Vue Single File Components (SFCs) using <script setup>.
         Universal rendering (SSR) is the default; <ClientOnly> for browser-only sections."
  V. Performance by Default
    OLD: next/image, next/font, next/script primitives required.
    NEW: @nuxt/image (<NuxtImg>), @nuxt/fonts, useScript() / @nuxt/scripts primitives required.

Added sections: None
Removed sections: None

Technology Constraints table changes:
  Framework: Next.js 16.x  →  Nuxt 3.x
  UI Library: React 19.x   →  Vue 3.x

Templates requiring updates:
  ✅ .specify/templates/plan-template.md — "Constitution Check" uses dynamic language; no hard-coded references
  ✅ .specify/templates/spec-template.md — generic; no framework-specific references
  ✅ .specify/templates/tasks-template.md — generic; task categories remain valid
  ✅ .specify/templates/agent-file-template.md — generic; no framework-specific references

Follow-up TODOs:
  - The actual codebase migration (removing Next.js, installing Nuxt) is OUT OF SCOPE
    for this constitution amendment. A migration feature spec should be created.
  - Biome support for Vue SFCs (.vue files) should be verified — Biome's Vue support
    is partial as of v2.x. If Biome cannot lint .vue files adequately, ESLint +
    @nuxt/eslint may need to replace or supplement Biome in a future amendment.
-->

# Tuki Constitution

## Core Principles

### I. Simplicity First (MVP Mindset)

Every feature MUST solve a confirmed user problem. The simplest working solution
MUST be implemented before adding complexity. Gold-plating, premature optimization,
and speculative abstractions are prohibited.

- Scope MUST be validated against the current MVP stage before implementation begins.
- "You Aren't Gonna Need It" (YAGNI) applies: no feature flags, no generic
  frameworks, no infrastructure for hypothetical future requirements.
- Complexity MUST be explicitly justified in the plan's Complexity Tracking table.

**Rationale**: Tuki is an MVP. Speed-to-validation outweighs architectural elegance
at this stage. Every hour spent on unused complexity is value destroyed.

### II. Type Safety (NON-NEGOTIABLE)

All source code MUST be written in TypeScript with `strict` mode enabled.

- Use of `any` is PROHIBITED. `unknown` with explicit narrowing is acceptable.
- All function parameters and return types MUST be explicitly typed or correctly
  inferred by the compiler — implicit `any` is a build failure.
- Third-party libraries without type definitions MUST be wrapped in typed adapters.
- Vue SFCs MUST use `<script setup lang="ts">` — non-typed script blocks are
  prohibited.

**Rationale**: TypeScript strict mode catches the class of bugs that are most
expensive to debug in a web application. Type safety is a minimum quality bar,
not an optional enhancement.

### III. Component Architecture

The UI MUST be built from Vue Single File Components (SFCs) using `<script setup lang="ts">`.

- Universal rendering (SSR) is the default in Nuxt. `<ClientOnly>` wrappers MUST
  only be introduced when a component genuinely requires browser-only APIs.
- Each component MUST have a single, clearly stated responsibility.
- Components MUST NOT reach outside their boundary for data without an explicit
  prop, emit, or composable interface.
- Nuxt auto-imports for components and composables MUST be used; explicit imports
  of auto-imported items are discouraged and add unnecessary noise.

**Rationale**: Nuxt's universal rendering and auto-import system reduce boilerplate
and keep server/client boundaries explicit. Deferring to SSR by default minimizes
client-side JavaScript and improves Core Web Vitals.

### IV. Code Quality Gates (NON-NEGOTIABLE)

Every commit MUST pass Biome lint (`biome check`) and format (`biome format`) checks.

- `--no-verify` bypasses are PROHIBITED without an accompanying issue documenting
  the exception and the remediation plan.
- Lint rules MUST NOT be disabled inline without a comment explaining why.
- The `lint` and `format` scripts defined in `package.json` are the source of truth
  for what "passing" means.
- **Note**: Biome's support for `.vue` SFCs MUST be validated after migration. If
  `.vue` file coverage is inadequate, a follow-up amendment MUST address linting
  strategy (e.g., adding `@nuxt/eslint`).

**Rationale**: Consistent lint and format enforcement reduces review friction and
prevents whole classes of defects from reaching production.

### V. Performance by Default

The application MUST meet Google Core Web Vitals thresholds (LCP ≤ 2.5s, CLS ≤ 0.1,
INP ≤ 200ms) on a median mobile connection.

- Images MUST use `<NuxtImg>` (via `@nuxt/image`) for automatic optimization,
  responsive sizing, and lazy loading.
- Fonts MUST be managed via `@nuxt/fonts` to eliminate layout shift caused by
  font loading.
- Third-party scripts MUST use `useScript()` from `@nuxt/scripts` with an
  appropriate loading mode (`lazy`, `manual`, etc.).
- Bundle size regressions introduced by new dependencies MUST be justified in the
  PR description.

**Rationale**: Performance is a feature. Core Web Vitals directly affect user
retention and search ranking. Nuxt's official modules provide the primitives;
their use is mandatory.

## Technology Constraints

The following technology decisions are locked for this project stage and MUST NOT
be changed without a constitution amendment:

| Layer              | Technology   | Version      |
| ------------------ | ------------ | ------------ |
| Framework          | Nuxt         | 4.x          |
| UI Library         | Vue          | 3.x          |
| Language           | TypeScript   | 5.x (strict) |
| Styling            | Tailwind CSS | 4.x          |
| Linter / Formatter | Biome        | 2.x          |
| Deployment         | Vercel       | latest       |

New runtime dependencies MUST be evaluated against bundle size impact and
maintenance status before being added to `package.json`.

## Development Workflow

- **Branching**: Feature branches MUST be named `###-short-description` matching
  the feature spec directory (e.g., `001-user-auth`).
- **Commits**: Each commit MUST represent a coherent unit of work and MUST pass
  all quality gates (Principle IV).
- **Specs**: A feature spec in `.specify/specs/###-feature-name/` MUST exist before
  implementation begins on any non-trivial feature.
- **Review**: All pull requests MUST be reviewed before merge. Self-merge is only
  permitted for trivial fixes (typos, config, dependency bumps).
- **Deployment**: The `main` branch is always deployable. Merging broken code to
  `main` is a constitution violation.

## Governance

This constitution supersedes all other implicit practices or conventions. When in
conflict, the constitution wins.

**Amendment procedure**:

1. Open a PR with the proposed change to `.specify/memory/constitution.md`.
2. State the version bump type (MAJOR / MINOR / PATCH) and rationale in the PR.
3. All affected templates in `.specify/templates/` MUST be updated in the same PR.
4. At least one reviewer MUST approve before merge.

**Versioning policy**:

- MAJOR: Principle removal, redefinition, or backward-incompatible governance change.
- MINOR: New principle or section added; material expansion of existing guidance.
- PATCH: Clarification, wording improvement, or typo fix.

**Compliance**: Every PR review MUST verify that the change does not violate any
active principle. Violations discovered post-merge MUST be filed as issues and
resolved within the next sprint.

---

**Version**: 2.0.0 | **Ratified**: 2026-03-02 | **Last Amended**: 2026-03-02
