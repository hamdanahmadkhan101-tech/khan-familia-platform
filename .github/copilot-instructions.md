# Copilot Instructions

- Foundation only: do not add business logic, database schema, or feature modules.
- TypeScript everywhere with strict typing and explicit exports.
- Respect boundaries: apps may depend on packages; packages must not import from apps.
- Prefer @khan-familia/\* for cross-package imports; avoid deep relative imports across packages.
- Use @/ for app-local imports only (within the same app).
- Keep configuration centralized and reusable; avoid unnecessary abstractions.
- Update READMEs and ADRs when changes affect structure or architecture.
