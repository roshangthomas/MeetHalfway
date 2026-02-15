# MeetHalfway - Claude Code Guidelines

## Project Overview
React Native + Expo (SDK 52) app that finds fair meeting places between two people based on equal travel time. TypeScript strict mode.

## Commands
- `npx expo start --clear` — Start dev server
- `npx tsc --noEmit` — Type-check (run after changes)

## Architecture

```
src/
  api/client.ts        — Cached Axios client for Google Maps API
  components/          — Reusable UI components (React.memo)
  constants/           — Design tokens (colors, spacing, shadows, messages, map)
  hooks/               — Custom hooks (useDebounce, useSavedPlaces)
  providers/           — Context providers
  screens/             — Screen components (Home, Results, RestaurantDetail, etc.)
  services/            — Business logic (location, places, distanceMatrix)
  styles/              — StyleSheet definitions
  types.ts             — Core types (Restaurant, Location, TravelMode)
  types/api.ts         — API response types
  utils/               — Utility functions (re-exported from utils/index.ts)
```

## Code Rules

### Design Tokens — No Magic Numbers
Always use constants from `src/constants/`:
- **Colors**: `COLORS.PRIMARY`, `COLORS.TEXT`, etc. — never hardcoded hex values
- **Spacing**: `SPACING.SMALL` (8), `SPACING.MEDIUM` (16), `SPACING.LARGE` (20), `SPACING.XL` (24)
- **Font sizes**: `FONT_SIZES.SMALL` (12), `FONT_SIZES.MEDIUM` (14), `FONT_SIZES.LARGE` (16)
- **Border radius**: `BORDER_RADIUS.SMALL` (4), `BORDER_RADIUS.MEDIUM` (8), `BORDER_RADIUS.LARGE` (12)
- **Shadows**: Import from `src/constants/shadows.ts`

### Component Patterns
- Wrap components in `React.memo` for performance
- Use `FlatList` with `windowSize`, `removeClippedSubviews` for lists
- Use `expo-image` (not `<Image>`) for remote images with `cachePolicy: "disk"`
- Keep styles in separate `src/styles/` files or colocated StyleSheet.create

### TypeScript
- Strict mode is on — no `any` types, no `@ts-ignore`
- Define new types in `src/types.ts` or `src/types/api.ts`
- Use `as const` for constant objects

### Imports & Exports
- Utils are re-exported from `src/utils/index.ts` — import from there
- Constants are re-exported from `src/constants/index.ts`

### State & Data
- Use AsyncStorage for local persistence
- Google API client in `src/api/client.ts` has built-in caching with TTLs — don't add duplicate caching
- Use `@tanstack/react-query` patterns where applicable

### Error Handling & Logging
- Always use `logger` from `src/utils/logger.ts` — never use `console.log`, `console.warn`, etc.
- Use centralized error messages from `src/constants/messages.ts` — never hardcode error strings
- Wrap async operations in try-catch blocks
- Use `ErrorBoundary` for component-level error catching
- Handle API errors using `handleAxiosError` from `src/utils/errors.ts`
- Provide user-friendly error messages — technical errors should be logged, not displayed
- Implement graceful degradation — always provide fallbacks (e.g., geometric midpoint if API fails)

### Naming Conventions
- **Components**: PascalCase (e.g., `LocationInput`, `RestaurantCard`)
- **Files**: Match component name (e.g., `LocationInput.tsx`)
- **Hooks**: Start with `use` (e.g., `useDebounce`, `useLocationPermission`)
- **Functions**: camelCase (e.g., `calculateMidpoint`, `formatDuration`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `ERROR_MESSAGES`, `SPACING`)
- **Types/Interfaces**: PascalCase (e.g., `Restaurant`, `Location`, `TravelMode`)
- **Private methods**: Prefix with underscore if truly private (e.g., `_setupInterceptors`)
- **Boolean variables**: Use `is`, `has`, `should` prefix (e.g., `isLoading`, `hasError`)

### Performance Best Practices
- Use `React.memo` for components that receive stable props
- Use `useMemo` for expensive calculations
- Use `useCallback` for functions passed as props to memoized components
- For lists: Use `FlatList` with `keyExtractor`, `getItemLayout` (if fixed height), `windowSize={10}`, `removeClippedSubviews={true}`
- Lazy load images with `expo-image` and `cachePolicy: "disk"`
- Avoid inline object/array creation in render (creates new references)
- Debounce user input with `useDebounce` hook
- Use `InteractionManager.runAfterInteractions()` for non-critical work after animations
- Avoid unnecessary re-renders — check dependencies in `useEffect`, `useMemo`, `useCallback`

### Accessibility Guidelines
- Always provide `accessibilityLabel` for interactive elements
- Use `accessibilityRole` appropriately (`button`, `text`, `header`, etc.)
- Add `accessibilityHint` for complex interactions
- Ensure touch targets are at least 44x44 points
- Test with screen readers (VoiceOver/TalkBack)
- Use semantic HTML where possible (React Native accessibility props)
- Ensure sufficient color contrast (WCAG AA minimum)

### Code Organization & File Structure
- Keep files under 300 lines — split if larger
- One component per file (except related sub-components)
- Co-locate related files (component + styles + tests)
- Use barrel exports (`index.ts`) for clean imports
- Group imports: external → internal → types → styles
- Separate business logic from UI — services in `src/services/`, components in `src/components/`
- Keep screen components in `src/screens/`, reusable components in `src/components/`

### Async/Await Patterns
- Always use `async/await` over `.then()` chains
- Wrap async operations in try-catch blocks
- Use `Promise.all()` for parallel independent operations
- Use `Promise.allSettled()` when you need all results regardless of failures
- Don't forget to handle loading states
- Cancel async operations on unmount (use AbortController or cleanup functions)
- Return early from async functions on error conditions

### Memory Management
- Clean up subscriptions, timers, and listeners in `useEffect` cleanup
- Remove event listeners in component unmount
- Clear cached data when appropriate (respect TTLs in API client)
- Avoid memory leaks from closures capturing large objects
- Use `WeakMap`/`WeakSet` for caches that should be garbage collected

### Security Practices
- Never commit API keys — use environment variables (`process.env.EXPO_PUBLIC_*`)
- Validate and sanitize user input
- Use HTTPS for all API calls
- Don't log sensitive data (passwords, tokens, personal info)
- Validate API responses before using data
- Use TypeScript types to prevent injection attacks

### TypeScript Best Practices
- No `any` types — use `unknown` if type is truly unknown, then narrow
- No `@ts-ignore` or `@ts-expect-error` — fix the underlying issue
- Use type guards for runtime type checking
- Prefer `interface` for object shapes, `type` for unions/intersections
- Use `as const` for literal types and constant objects
- Define types close to usage, shared types in `src/types.ts` or `src/types/api.ts`
- Use utility types (`Partial`, `Pick`, `Omit`, `Record`) when appropriate
- Avoid type assertions (`as`) — prefer type guards or proper typing

### State Management
- Use local state (`useState`) for component-specific state
- Use Context for shared state that doesn't change frequently
- Use AsyncStorage for persistence (via hooks like `useSavedPlaces`)
- Keep state as close to where it's used as possible
- Avoid prop drilling — use Context or state management library if needed
- Normalize nested data structures when possible

### Testing Considerations
- Write unit tests for utility functions and services
- Test error cases, not just happy paths
- Mock external dependencies (API calls, AsyncStorage)
- Use descriptive test names: `describe('functionName', () => { it('should do X when Y', ...) })`
- Keep tests simple and focused — one assertion per test when possible

### Code Review Checklist
Before submitting code, ensure:
- [ ] TypeScript compiles without errors (`npx tsc --noEmit`)
- [ ] No `console.log` statements (use logger)
- [ ] All error messages use constants from `messages.ts`
- [ ] Components use design tokens (no magic numbers)
- [ ] Accessibility props are present on interactive elements
- [ ] Async operations have error handling
- [ ] No `any` types or `@ts-ignore`
- [ ] Files are under 300 lines
- [ ] Performance optimizations applied (memo, useMemo, useCallback where needed)
- [ ] Code follows naming conventions

### Don'ts
- Don't add `console.log` — use the logger utility in `src/utils/logger.ts`
- Don't create new files when you can extend existing ones
- Don't modify navigation structure without discussing first
- Don't add new dependencies without asking
- Don't hardcode API keys — use environment variables
- Don't use `any` types — use `unknown` and type guards
- Don't ignore TypeScript errors — fix them properly
- Don't create inline styles with magic numbers — use constants
- Don't skip error handling — always handle async errors
- Don't forget cleanup in `useEffect` — prevent memory leaks
