# FurniSpace Mobile

Expo + React Native + TypeScript project scaffolded with a feature-first architecture.

## Setup
1. Install dependencies:
   - `npm install`
2. Copy env file:
   - `.env.example` -> `.env`
3. Update backend URL:
   - `EXPO_PUBLIC_API_BASE_URL`
4. Run app:
   - `npm run start`
   - `npm run android` / `npm run ios`

## Structure
- `src/app`: app composition, providers, root navigation
- `src/core`: API client, interceptors, config, storage, errors
- `src/features`: business features (`auth`, `home`, `product`, ...)
- `src/shared`: reusable UI, theme, constants, common types

## Notes
- Homepage UI is implemented from Figma in `src/features/home/screens/HomeScreen.tsx`.
- `src/features/auth` is kept as a sample feature template for API + state flow.
"# FurniSpace-Mobile" 
