# Changelog

All notable changes to Hoddle Melbourne are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

When you finish a task in `todo.md`, add a line here under `## [Unreleased]` in the appropriate category (`Added`, `Changed`, `Fixed`, `Removed`, `Security`). When a phase ships, cut a version and move the entries under a dated heading.

---

## [Unreleased]

### Added
- `CLAUDE.md` master briefing covering stack, design non-negotiables, conventions, and the documentation map.
- `todo.md` with Phase 1 scope (landing + auth + onboarding + student dashboard) and parked Phase 2 items.
- `docs/architecture.md` describing route groups, Supabase integration, auth flow, and component tiers.
- `docs/database-schema.md` documenting `profiles` and `onboarding_responses` tables with RLS policies.
- `docs/component-library.md` inventory of primitives, patterns, and layout shells.
- `docs/design.md` visual design system with Hoddle Blue primary palette.
- `docs/product-one-pager.md` product context reference.

### Changed
- Primary brand colour from terracotta `#a63c26` to Hoddle Blue `#1e3a5f`. Ambient shadows re-tinted to match.

---

## Template for future entries

```
## [0.1.0] — YYYY-MM-DD  ← Phase 1 ship

### Added
- Landing page at `/`
- Magic-link signup and login flows
- 5-step onboarding wizard writing to `onboarding_responses`
- Student dashboard at `/dashboard` with goals summary and empty states

### Changed
- …

### Fixed
- …

### Security
- Enabled RLS on `profiles` and `onboarding_responses`; verified cross-user isolation.
```