# Mobile Architecture Blueprint (React Native + TypeScript)

## Goals
- Keep UI/UX fast and maintainable.
- Integrate cleanly with existing ASP.NET backend APIs.
- Scale by feature without over-engineering.

## Architecture Style
- Feature-first structure (`src/features/*`) for domain ownership.
- Lightweight layered design:
  - Presentation: screens, components, navigation, theme
  - Domain/Feature: hooks, models, simple use-case logic
  - Data: API services, HTTP client, storage, mappers
  - Core: env, errors, interceptors, shared infrastructure

## Request Flow
1. Screen triggers a feature hook.
2. Hook calls feature API service.
3. Service uses shared `httpClient` with interceptors.
4. Response DTO is mapped to UI model.
5. State updates (React Query / Zustand).
6. UI re-renders for loading/error/success.

## Conventions
- No direct API calls inside UI components.
- Split backend DTO and app UI models.
- Keep shared UI in `src/shared/components`.
- Keep feature-specific UI in `src/features/<name>/components`.
- Centralize constants (query keys, route keys, storage keys).
- Use barrel exports when needed after codebase grows.

## Suggested Libraries
- `@react-navigation/native`, native-stack
- `@tanstack/react-query`
- `zustand`
- `axios`
- `react-hook-form` + `zod`
- `@react-native-async-storage/async-storage`
- `react-native-keychain` (for tokens)
