# Code Quality Improvement Plan

This document outlines recommended improvements for the MeetHalfway codebase to enhance maintainability, type safety, performance, and overall code quality.

---

## Table of Contents

1. [Priority Overview](#priority-overview)
2. [High Priority Tasks](#high-priority-tasks)
3. [Medium Priority Tasks](#medium-priority-tasks)
4. [Low Priority Tasks](#low-priority-tasks)
5. [Detailed Recommendations](#detailed-recommendations)

---

## Priority Overview

| Priority | Category | Estimated Effort | Status |
|----------|----------|------------------|--------|
| 🔴 High | Architecture & File Organization | 2-3 days | ✅ COMPLETED |
| 🔴 High | Type Safety Fixes | 1-2 days | ✅ COMPLETED |
| 🔴 High | Duplicate Code Elimination | 1-2 days | ✅ COMPLETED |
| 🟡 Medium | Custom Hooks Extraction | 1 day | ✅ COMPLETED |
| 🟡 Medium | API Abstraction Layer | 1-2 days | ✅ COMPLETED |
| 🟡 Medium | Package.json Cleanup | 0.5 day | ✅ COMPLETED |
| 🟡 Medium | Performance Optimizations | 1 day | ✅ COMPLETED |
| 🟢 Low | Accessibility Improvements | 1 day | ✅ COMPLETED |
| 🟢 Low | Error Boundary Enhancement | 0.5 day | ✅ COMPLETED |
| 🟢 Low | Console Cleanup | 0.5 day | ✅ COMPLETED |

---

## High Priority Tasks

### 1. Architecture & File Organization ✅ COMPLETED

#### Problem
`App.tsx` was 931 lines containing `HomeScreen`, `ChangeLocationScreen`, and the main `App` component all in one file.

#### Completed Tasks
- [x] Extract `HomeScreen` to `src/screens/HomeScreen.tsx` (294 lines)
- [x] Extract `ChangeLocationScreen` to `src/screens/ChangeLocationScreen.tsx` (193 lines)
- [x] Keep `App.tsx` focused only on navigation setup and providers (96 lines)
- [x] Target achieved: Each file under 300 lines

#### New File Structure Created
```
src/
├── components/
│   └── (existing components)
├── constants/
│   ├── colors.ts
│   └── index.ts
├── hooks/                  # NEW
│   ├── useLocationPermission.ts
│   └── index.ts
├── screens/
│   ├── HomeScreen.tsx      # EXTRACTED from App.tsx
│   ├── ChangeLocationScreen.tsx  # EXTRACTED from App.tsx
│   ├── ResultsScreen.tsx
│   ├── RestaurantDetailScreen.tsx
│   ├── NoResultsScreen.tsx
│   └── LocationPermissionScreen.tsx
├── services/
│   ├── location.ts         # REFACTORED
│   └── places.ts           # REFACTORED
├── styles/
│   └── (existing styles)
├── types/
│   ├── api.ts              # NEW: Shared API types
│   ├── env.d.ts
│   └── index.ts
└── utils/                  # NEW
    ├── duration.ts
    ├── formatting.ts
    ├── settings.ts
    └── index.ts
```

---

### 2. Type Safety Fixes ✅ COMPLETED

#### Problems Fixed
- Removed excessive use of `any` type
- Removed `@ts-ignore` comments - properly typed the accuracy property
- Removed unnecessary type assertions like `userLocation as LocationType`
- Standardized on `Location` type
- Added proper error type narrowing using `axios.isAxiosError()`

#### Code Changes Made

**Before:**
```typescript
catch (error: any) {
    if (error && error.response === undefined && error.request) {
        // ...
    }
}
```

**After:**
```typescript
catch (error: unknown) {
    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (!axiosError.response && axiosError.request) {
            throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
        }
    }
    if (error instanceof Error) {
        // Handle Error type
    }
}
```

#### Files Updated
- [x] `src/services/location.ts` - Removed `any`, added proper typing for Android permissions
- [x] `src/services/places.ts` - Replaced `any` with `unknown` and proper type guards
- [x] `src/screens/HomeScreen.tsx` - Removed type assertions
- [x] `src/screens/ChangeLocationScreen.tsx` - Removed type assertions

---

### 3. Duplicate Code Elimination ✅ COMPLETED

#### Duplications Resolved

| Duplication | Resolution |
|-------------|------------|
| `GooglePlacesResponse` interface | ✅ Moved to `src/types/api.ts` |
| `GoogleDirectionsResponse` interface | ✅ Moved to `src/types/api.ts` |
| `GoogleGeocodingResponse` interface | ✅ Moved to `src/types/api.ts` |
| `GooglePlacesAutocompleteResponse` interface | ✅ Moved to `src/types/api.ts` |
| `GooglePlaceDetailsResponse` interface | ✅ Moved to `src/types/api.ts` |
| `parseTravelTime()` / `convertDurationToMinutes()` | ✅ Moved to `src/utils/duration.ts` |
| `promptForPreciseLocation()` logic | ✅ Created `useLocationPermission` hook |
| `openLocationSettings()` function | ✅ Moved to `src/utils/settings.ts` |
| `formatAddressForDisplay()` | ✅ Moved to `src/utils/formatting.ts` |

#### New Files Created
- [x] `src/types/api.ts` - Shared API response interfaces
- [x] `src/utils/duration.ts` - Time parsing utilities (`parseDurationToMinutes`)
- [x] `src/utils/formatting.ts` - Display formatting functions (`formatAddressForDisplay`)
- [x] `src/utils/settings.ts` - Device settings helpers (`openLocationSettings`)
- [x] `src/utils/index.ts` - Barrel export file
- [x] `src/hooks/useLocationPermission.ts` - Location permission management hook
- [x] `src/hooks/index.ts` - Barrel export file

---

## Medium Priority Tasks

### 4. Custom Hooks Extraction ✅ COMPLETED

#### Completed Tasks
- [x] Create `src/hooks/useLocationPermission.ts`
- [x] Create `src/hooks/useDebounce.ts`

#### Hook Specifications

**useLocationPermission.ts** ✅ IMPLEMENTED
```typescript
interface UseLocationPermissionReturn {
    permissionStatus: LocationPermissionStatus;
    setPermissionStatus: (status: LocationPermissionStatus) => void;
    checkPermission: () => Promise<LocationPermissionStatus>;
    promptForPreciseLocation: (onLocationUpdated?: (location: Location) => void) => void;
    openSettings: () => void;
}
```

**useDebounce.ts** ✅ IMPLEMENTED
```typescript
function useDebounce<T>(value: T, delay: number): T;
```

---

### 5. API Abstraction Layer ✅ COMPLETED

#### Completed Tasks
- [x] Create `src/api/client.ts` with axios instance
- [x] Add request/response interceptors for error handling
- [x] Centralize API key configuration
- [x] Define endpoint constants

---

### 6. Package.json Cleanup ✅ COMPLETED

#### Completed Tasks
- [x] Remove invalid dependency `"18": "^0.0.0"`
- [x] Remove unnecessary `@types/axios` (axios includes types)

---

### 7. Performance Optimizations ✅ COMPLETED

#### Completed Tasks
- [x] Added `React.memo()` to `RestaurantCard` component
- [x] Added `FlatList` optimization props (`windowSize`, `initialNumToRender`, `maxToRenderPerBatch`, `removeClippedSubviews`, `getItemLayout`)
- [x] Added `useCallback` for `renderItem` and `getItemLayout` functions

---

### 8. Hardcoded Values Cleanup ✅ COMPLETED

#### Completed Tasks
- [x] Move inline colors to `COLORS` constant
- [x] Added semantic color names (WARNING_BANNER_BG, WARNING_BANNER_BORDER, WARNING_BANNER_TEXT, SKELETON, BLACK)
- [x] Updated `src/styles/App.styles.ts` and `src/styles/Results.styles.ts`

---

### 9. Console Statement Cleanup ✅ COMPLETED

#### Completed Tasks
- [x] Created `src/utils/logger.ts` utility
- [x] Replaced all console statements with logger in services
- [x] Replaced all console statements with logger in screens
- [x] Removed debug console.log statements from LocationInput

---

## Low Priority Tasks

### 10. Accessibility Improvements ✅ COMPLETED

#### Completed Tasks
- [x] Added `accessibilityLabel`, `accessibilityHint`, and `accessibilityRole` to main search button
- [x] Added accessibility props to ErrorBoundary retry button

---

### 11. Error Boundary Enhancement ✅ COMPLETED

#### Completed Tasks
- [x] Added `resetError()` method for retry functionality
- [x] Added "Try Again" button to error state
- [x] Improved error message display with title and description
- [x] Added styling for error state UI

---

### 12. TypeScript Configuration Strengthening

#### Tasks
- [ ] Enable stricter TypeScript options
- [ ] Add path aliases for cleaner imports

#### Updated tsconfig.json
```json
{
    "extends": "expo/tsconfig.base",
    "compilerOptions": {
        "strict": true,
        "noImplicitAny": true,
        "noUnusedLocals": true,
        "noUnusedParameters": true,
        "noImplicitReturns": true,
        "noFallthroughCasesInSwitch": true,
        "exactOptionalPropertyTypes": true,
        "baseUrl": ".",
        "paths": {
            "@components/*": ["src/components/*"],
            "@screens/*": ["src/screens/*"],
            "@services/*": ["src/services/*"],
            "@hooks/*": ["src/hooks/*"],
            "@utils/*": ["src/utils/*"],
            "@constants/*": ["src/constants/*"],
            "@types/*": ["src/types/*"],
            "@api/*": ["src/api/*"]
        }
    }
}
```

---

### 13. Documentation

#### Tasks
- [ ] Add JSDoc comments to all exported functions
- [ ] Document complex business logic
- [ ] Update main README.md with project overview
- [ ] Add inline comments for non-obvious code

---

## Progress Tracking

### Phase 1: Foundation (Week 1) ✅ COMPLETED
- [x] Complete High Priority Task 1 (Architecture)
- [x] Complete High Priority Task 2 (Type Safety)
- [x] Complete High Priority Task 3 (Duplicate Code)

### Phase 2: Refactoring (Week 2) ✅ COMPLETED
- [x] Complete Medium Priority Task 4 (Custom Hooks)
- [x] Complete Medium Priority Task 5 (API Layer)
- [x] Complete Medium Priority Task 6 (Package Cleanup)

### Phase 3: Polish (Week 3) ✅ COMPLETED
- [x] Complete Medium Priority Task 7 (Performance)
- [x] Complete Medium Priority Task 8 (Hardcoded Values)
- [x] Complete Medium Priority Task 9 (Console Cleanup)

### Phase 4: Quality Assurance (Week 4) ✅ COMPLETED
- [x] Complete Task 10 (Accessibility)
- [x] Complete Task 11 (Error Boundary)
- [x] Tasks 12-13 (TypeScript Config, Documentation) - Deferred

---

## Changelog

### 2026-01-21 - Phase 3 & 4 Completed

#### Performance Improvements
- `src/components/RestaurantList.tsx` - Added React.memo, FlatList optimizations

#### Console Cleanup
- `src/services/location.ts` - Replaced all console.* with logger.*
- `src/services/places.ts` - Replaced all console.* with logger.*
- `src/screens/HomeScreen.tsx` - Replaced all console.* with logger.*
- `src/screens/ChangeLocationScreen.tsx` - Replaced all console.* with logger.*
- `src/components/LocationInput.tsx` - Removed debug console.log statements

#### Accessibility & Error Handling
- `src/screens/HomeScreen.tsx` - Added accessibility props to main button
- `src/components/ErrorBoundary.tsx` - Added reset functionality and improved UI

---

### 2026-01-21 - Phase 2 Completed

#### New Files Created
- `src/hooks/useDebounce.ts` - Generic debounce hook
- `src/api/client.ts` - Axios client with interceptors
- `src/api/index.ts` - Barrel exports
- `src/utils/logger.ts` - Dev-only logging utility

#### Files Modified
- `package.json` - Removed invalid "18" dependency and @types/axios
- `src/constants/colors.ts` - Added semantic color names
- `src/styles/App.styles.ts` - Updated to use COLORS constants
- `src/styles/Results.styles.ts` - Updated to use COLORS constants
- `src/hooks/index.ts` - Added useDebounce export
- `src/utils/index.ts` - Added logger export

---

### 2026-01-21 - Phase 1 Completed

#### Files Created
- `src/screens/HomeScreen.tsx` - Extracted from App.tsx
- `src/screens/ChangeLocationScreen.tsx` - Extracted from App.tsx
- `src/types/api.ts` - Shared API response interfaces
- `src/utils/duration.ts` - Time parsing utilities
- `src/utils/formatting.ts` - Display formatting functions
- `src/utils/settings.ts` - Device settings helpers
- `src/utils/index.ts` - Barrel exports
- `src/hooks/useLocationPermission.ts` - Location permission hook
- `src/hooks/index.ts` - Barrel exports

#### Files Modified
- `App.tsx` - Reduced from 931 lines to 96 lines (navigation only)
- `src/services/location.ts` - Refactored with proper types, removed duplicates
- `src/services/places.ts` - Refactored with shared types
- `src/screens/ResultsScreen.tsx` - Updated to use shared duration utility

#### Key Improvements
1. **Code Organization**: App.tsx reduced by 90% (931 → 96 lines)
2. **Type Safety**: Removed all `any` types and `@ts-ignore` comments
3. **DRY Principle**: Eliminated duplicate interfaces and utility functions
4. **Reusability**: Created shared hooks and utilities for common patterns

---

## Notes

- Each task should be completed in a separate branch
- Run full app testing after each major change
- Update this document as tasks are completed
- Consider creating GitHub issues for each task for better tracking
