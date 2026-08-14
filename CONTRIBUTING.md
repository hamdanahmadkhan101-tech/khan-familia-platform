# Contributing to Khan Familia Travels Platform

First off, thank you for considering contributing to Khan Familia Travels! It's people like you that make this platform such a great tool.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please treat fellow contributors with respect.

## Getting Started

1. Fork the repository and clone it locally.
2. Install dependencies with `pnpm install`.
3. Set up your environment variables based on `.env.example`.
4. Run the development server with `pnpm run dev`.

## Pull Request Process

1. Ensure your code passes all linting (`pnpm run lint`) and typechecking (`pnpm run typecheck`).
2. Run the test suite (`pnpm run test`) and ensure all tests pass.
3. Follow the Conventional Commits format for your commit messages.
4. Update the README.md with details of changes to the interface, if applicable.
5. Submit a pull request to the `develop` branch. Our CI pipelines will automatically run checks on your PR.

## Architecture

This is a Turborepo monorepo.

- `apps/web`: Next.js frontend
- `apps/api`: Express backend
- `apps/worker`: BullMQ background job processor
- `packages/*`: Shared utilities, UI components, and database models.

We use Prisma for database ORM and TailwindCSS for styling. Please adhere to the rules defined in `RULES.md` and `CONTEXT.md` for architectural patterns.
