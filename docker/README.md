# Docker Strategy (Scaffold)

Docker support is intentionally scaffolded but not enabled yet. The intent is to keep a clear
layout for future containerization without introducing runtime complexity during foundation work.

Planned layout:

- docker/Dockerfile.web: web app image
- docker/Dockerfile.api: API app image
- docker/Dockerfile.worker: worker image
- docker/compose.dev.yml: local development composition

When Dockerization begins, the goal is to keep images small, deterministic, and aligned with the
monorepo build graph managed by Turborepo.
