# MeetHalfway Technical Documentation

A deep dive into the architecture, technology choices, design tradeoffs, and optimizations powering the MeetHalfway mobile application.

---

## Table of Contents

1. [Tech Stack Overview](#tech-stack-overview)
2. [System Architecture](#system-architecture)
3. [Core Algorithms](#core-algorithms)
4. [API Layer Design](#api-layer-design)
5. [State Management](#state-management)
6. [Performance Optimizations](#performance-optimizations)
7. [Design Tradeoffs](#design-tradeoffs)
8. [Error Handling Strategy](#error-handling-strategy)
9. [Security Considerations](#security-considerations)
10. [Future Scalability](#future-scalability)

---

## Tech Stack Overview

### Core Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| **React Native** | 0.76.7 | Cross-platform mobile framework |
| **Expo** | SDK 52 | Development toolchain & native API access |
| **TypeScript** | 5.3 | Static typing & developer experience |

### Key Libraries

| Library | Purpose | Why Chosen |
|---------|---------|------------|
| `@react-navigation/stack` | Navigation | Industry standard, deep linking support, type-safe |
| `@tanstack/react-query` | Server state management | Caching, background refetching, optimistic updates |
| `axios` | HTTP client | Interceptors, request/response transformation |
| `react-native-maps` | Map rendering | Native Google Maps integration |
| `lottie-react-native` | Animations | High-quality vector animations, small file size |
| `expo-location` | Geolocation | Unified API for iOS/Android location services |
| `@react-native-community/netinfo` | Network status | Real-time connectivity monitoring |
| `@react-native-async-storage/async-storage` | Persistence | Key-value storage for user preferences |

### External Services

| Service | APIs Used | Purpose |
|---------|-----------|---------|
| **Google Maps Platform** | Geocoding, Directions, Places, Distance Matrix | All location-based functionality |

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           App Entry (App.tsx)                        │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                     QueryProvider (TanStack)                     │ │
│  │  ┌───────────────────────────────────────────────────────────┐  │ │
│  │  │                  NavigationContainer                       │  │ │
│  │  │  ┌─────────────────────────────────────────────────────┐  │  │ │
│  │  │  │              ErrorBoundary (Global)                  │  │  │ │
│  │  │  │  ┌─────────────────────────────────────────────┐    │  │  │ │
│  │  │  │  │            OfflineNotice                     │    │  │  │ │
│  │  │  │  │  ┌─────────────────────────────────────┐    │    │  │  │ │
│  │  │  │  │  │         Stack.Navigator             │    │    │  │  │ │
│  │  │  │  │  │  • HomeScreen                       │    │    │  │  │ │
│  │  │  │  │  │  • ResultsScreen                    │    │    │  │  │ │
│  │  │  │  │  │  • RestaurantDetailScreen           │    │    │  │  │ │
│  │  │  │  │  │  • LocationPermissionScreen         │    │    │  │  │ │
│  │  │  │  │  │  • ChangeLocationScreen             │    │    │  │  │ │
│  │  │  │  │  │  • NoResultsScreen                  │    │    │  │  │ │
│  │  │  │  │  └─────────────────────────────────────┘    │    │  │  │ │
│  │  │  │  └─────────────────────────────────────────────┘    │  │  │ │
│  │  │  └─────────────────────────────────────────────────────┘  │  │ │
│  │  └───────────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                        AnimatedSplash (Overlay)                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Directory Structure Philosophy

```
src/
├── api/              # HTTP client, endpoints, caching configuration
├── components/       # Reusable UI components (dumb components)
├── constants/        # Static values, colors, messages, configuration
├── hooks/            # Custom React hooks for reusable logic
├── providers/        # React Context providers
├── screens/          # Screen components (smart components)
├── services/         # Business logic, API integration
├── styles/           # Shared StyleSheet definitions
├── types/            # TypeScript interfaces and types
└── utils/            # Pure utility functions
```

**Design Principle**: Clear separation of concerns with a unidirectional data flow.

---

## Core Algorithms

### 1. Road-Based Midpoint Calculation

Unlike simple geographic center calculation, MeetHalfway computes the midpoint along the actual road route.

```
Algorithm: calculateRoadMidpoint(locationA, locationB)

1. Fetch route via Google Directions API
2. Extract all route steps with distances
3. Calculate total route distance
4. Target = totalDistance / 2
5. Iterate through steps:
   - Accumulate distance
   - When accumulated + stepDistance >= target:
     - Calculate ratio = (target - accumulated) / stepDistance
     - Interpolate position along current step
     - Return interpolated lat/lng
6. Fallback: Return simple geographic midpoint
```

**Why this approach?**
- Geographic center can be in inaccessible areas (mountains, water)
- Road midpoint ensures the location is actually reachable
- More practical for real-world navigation

### 2. Practical Midpoint Enhancement

The practical midpoint algorithm goes beyond road midpoint by finding a location with actual venues nearby.

```
Algorithm: findPracticalMidpoint(locationA, locationB, travelMode)

1. Calculate road midpoint
2. Search for nearby venues in expanding radii: [500m, 1500m, 3000m, ...]
3. For each candidate venue, calculate:
   - Travel time from location A
   - Travel time from location B
   - Fairness score (time difference)
   - Quality score (ratings)
   - Accessibility score
4. Weighted scoring:
   - 35% Fairness (minimal time difference)
   - 30% Travel efficiency (minimal total time)
   - 25% Venue quality
   - 10% Road accessibility
5. Return location of highest-scoring venue
```

### 3. Venue Ranking Algorithm

The `findOptimalMeetingPlaces` function scores venues for the final results:

```
Score = (Fairness × 0.50) + (Quality × 0.30) + (Efficiency × 0.20)

Where:
- Fairness = 100 - min(|travelTimeA - travelTimeB|, 100)
- Quality = rating × 20 (normalized to 0-100)
- Efficiency = 100 - min((travelTimeA + travelTimeB) / 2, 100)
```

**Rationale**: Fairness is weighted highest because the core value proposition is finding equidistant meeting points.

---

## API Layer Design

### Centralized API Client

The `GoogleMapsApiClient` class implements a singleton pattern with built-in caching:

```typescript
class GoogleMapsApiClient {
    private client: AxiosInstance;
    private cache: Map<string, CacheEntry>;
    
    // Features:
    // - Request/response interceptors for logging
    // - Automatic error transformation
    // - In-memory caching with TTL
    // - Centralized API key management
}
```

### Cache Configuration

| Endpoint | TTL | Rationale |
|----------|-----|-----------|
| Geocoding | 24 hours | Addresses rarely change |
| Directions | 5 minutes | Traffic conditions vary |
| Distance Matrix | 5 minutes | Traffic conditions vary |
| Places Nearby | 10 minutes | Business data is stable |
| Place Autocomplete | 1 minute | User is actively typing |
| Place Details | 30 minutes | Business info is fairly stable |

### Batch Processing

The Distance Matrix API allows batching multiple origin-destination pairs:

```typescript
// Efficient: Single API call for all venues
const batchResults = await getBatchTravelInfo(
    locationA,           // Origin 1
    locationB,           // Origin 2
    venues,              // Up to 25 destinations
    travelMode
);

// Batching: 2 origins × 25 destinations = 50 elements per call
// vs. 50 separate API calls
```

**API Cost Savings**: ~96% reduction in API calls when querying 25 venues.

---

## State Management

### Strategy: Hybrid Approach

MeetHalfway uses a combination of state management techniques:

| State Type | Solution | Location |
|------------|----------|----------|
| Server state | TanStack Query | `QueryProvider` |
| UI state | React hooks | Component-local |
| Navigation state | React Navigation | Navigator |
| Form state | `useState` | Screen components |
| Permission state | Custom hook | `useLocationPermission` |

### React Query Configuration

```typescript
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000,      // 5 minutes
            gcTime: 30 * 60 * 1000,         // 30 minutes (garbage collection)
            retry: 2,                        // Retry failed requests twice
            refetchOnWindowFocus: false,    // Mobile: no window focus events
            refetchOnReconnect: false,      // Manual refresh preferred
            refetchOnMount: false,          // Preserve existing data
        },
    },
});
```

**Why these settings?**
- Mobile users expect consistent results during a session
- Unnecessary refetches waste data/battery
- Manual refresh gives user control

### Custom Hooks

#### `useLocationPermission`

Encapsulates all location permission logic:

```typescript
interface UseLocationPermissionReturn {
    permissionStatus: 'granted' | 'denied' | 'limited' | 'pending';
    checkPermission(): Promise<LocationPermissionStatus>;
    promptForPreciseLocation(onUpdate?: (location) => void): void;
    openSettings(): void;
}
```

#### `useDebounce`

Prevents excessive API calls during text input:

```typescript
// Usage: Debounce autocomplete API calls
const debouncedSearch = useDebounce(searchTerm, 300);
```

---

## Performance Optimizations

### 1. Progressive Location Loading

```
Timeline:
0ms   → Show loading state
50ms  → Check cached location (getLastKnownLocation)
100ms → Display cached location, show map
150ms → Background fetch fresh GPS coordinates
200ms → Update location silently if different
```

**User Perception**: App feels instant because cached location is shown immediately.

### 2. Splash Screen Optimization

```typescript
// Adaptive duration based on app readiness
duration={appReadyTime !== null && appReadyTime < 500 ? 500 : 800}
```

- Fast devices: 500ms splash (minimum for animation)
- Slow devices: 800ms splash (covers loading)

### 3. List Rendering Optimization

The `RestaurantList` component uses:
- `FlatList` with `keyExtractor` for efficient re-rendering
- `useMemo` for sorting/filtering to prevent recalculation
- `Image` component lazy loading for venue photos

### 4. Memory-Efficient Caching

```typescript
// Cache entries are keyed by normalized parameters
private getCacheKey(endpoint: string, params?: Record<string, unknown>): string {
    const sortedParams = params
        ? Object.keys(params).sort().map(key => `${key}=${params[key]}`).join('&')
        : '';
    return `${endpoint}?${sortedParams}`;
}
```

Sorting parameters ensures `{a:1, b:2}` and `{b:2, a:1}` hit the same cache entry.

### 5. Batch API Requests

Distance Matrix batching reduces API calls from O(n) to O(n/25):

| Venues | Without Batching | With Batching | Reduction |
|--------|-----------------|---------------|-----------|
| 20 | 40 calls | 2 calls | 95% |
| 50 | 100 calls | 4 calls | 96% |
| 100 | 200 calls | 8 calls | 96% |

---

## Design Tradeoffs

### 1. Expo vs. Bare React Native

**Chosen**: Expo (Managed Workflow)

| Pros | Cons |
|------|------|
| Faster development cycle | Larger app bundle size |
| OTA updates via EAS | Limited native module access |
| Simplified build process | Some advanced native features unavailable |
| Cross-platform consistency | Ejection required for some features |

**Rationale**: Development speed and maintainability outweigh the downsides for this app's scope.

### 2. In-Memory Cache vs. Persistent Cache

**Chosen**: In-memory (Map-based)

| Pros | Cons |
|------|------|
| Zero disk I/O latency | Cache lost on app restart |
| Simple implementation | No offline support |
| Predictable memory usage | Re-fetches required after restart |

**Rationale**: Location data is time-sensitive; stale cached routes could give bad directions. Fresh data on each session is acceptable.

### 3. Google Maps vs. Alternative Providers

**Chosen**: Google Maps Platform

| Alternative | Why Not Chosen |
|-------------|----------------|
| Mapbox | Fewer Points of Interest in Places API |
| HERE | Less familiar to users |
| OpenStreetMap | Requires self-hosting, less POI data |
| Apple Maps | iOS only |

**Rationale**: Google Maps has the most comprehensive POI database and is universally recognized.

### 4. Stack Navigation vs. Tab Navigation

**Chosen**: Stack Navigation

| Stack Navigator | Tab Navigator |
|-----------------|---------------|
| Linear user flow | Multi-screen persistent state |
| Clear back navigation | Quick switching between sections |
| Better for task-focused apps | Better for browsing apps |

**Rationale**: MeetHalfway has a linear flow: Enter locations → View results → Select venue → View details.

### 5. Class Components vs. Functional Components

**Chosen**: Functional components (except ErrorBoundary)

```typescript
// ErrorBoundary must be a class component
// (React requirement for componentDidCatch)
export class ErrorBoundary extends Component<Props, State> {
    static getDerivedStateFromError(error: Error): State { ... }
    componentDidCatch(error: Error, errorInfo: ErrorInfo) { ... }
}
```

**Rationale**: Functional components with hooks are more composable and easier to test. ErrorBoundary is a React API limitation.

### 6. Synchronous vs. Asynchronous Midpoint Calculation

**Chosen**: Asynchronous with fallback

```typescript
try {
    midpoint = await calculateRoadMidpoint(locationA, locationB);
} catch (error) {
    // Graceful degradation to simple geometric midpoint
    midpoint = calculateMidpoint(locationA, locationB);
}
```

**Rationale**: Always provide a result, even if the optimal route calculation fails.

---

## Error Handling Strategy

### Error Categories

| Category | Example | Handling |
|----------|---------|----------|
| **Network** | No internet | `OfflineNotice` banner |
| **Permission** | Location denied | Navigate to `LocationPermissionScreen` |
| **API** | Quota exceeded | Display user-friendly message |
| **Validation** | Invalid address | Inline error below input |
| **Runtime** | Uncaught exception | `ErrorBoundary` with retry |

### Error Message Centralization

All user-facing messages are centralized in `constants/messages.ts`:

```typescript
export const ERROR_MESSAGES = {
    USER_LOCATION_UNAVAILABLE: 'Unable to get your current location...',
    LOCATION_PERMISSION_DENIED: 'Location permission was denied...',
    API_QUOTA_EXCEEDED: 'API request limit exceeded...',
    // ...
} as const;
```

**Benefits**:
- Consistent messaging across the app
- Easy localization in the future
- Type-safe error references

### Graceful Degradation Patterns

```typescript
// Pattern 1: Fallback to simpler algorithm
let midpoint: Location;
try {
    midpoint = await findPracticalMidpoint(locationA, locationB, travelMode);
} catch (error) {
    midpoint = calculateMidpoint(locationA, locationB); // Simple average
}

// Pattern 2: Return safe defaults
export const getTravelInfo = async (...): Promise<TravelInfo> => {
    try {
        // API call
    } catch (error) {
        return { distance: 'Unknown', duration: 'Unknown' };
    }
};

// Pattern 3: Skip failed items, continue processing
for (const category of categories) {
    try {
        const venues = await searchVenues(midpoint, category);
        allVenues.push(...venues);
    } catch (error) {
        logger.error(`Failed to search ${category}:`, error);
        // Continue with other categories
    }
}
```

---

## Security Considerations

### API Key Protection

1. **Environment Variables**: API keys stored in `.env` file (gitignored)
2. **EAS Secrets**: Production keys stored in EAS secure storage
3. **Key Restrictions**: Google Cloud Console restrictions by:
   - Application (iOS bundle ID, Android package name)
   - API type (only required APIs enabled)

### Input Sanitization

```typescript
// User input is URL-encoded before API calls
const response = await googleMapsClient.get(ENDPOINTS.geocode, {
    address: encodeURIComponent(address)  // Prevent injection
});
```

### Network Security

- HTTPS enforced for all API communication
- 15-second timeout prevents hanging requests
- No sensitive data stored in AsyncStorage

---

## Future Scalability

### Prepared for Growth

| Feature | Current Implementation | Scalability Path |
|---------|----------------------|------------------|
| Caching | In-memory Map | Replace with Redis/SQLite |
| State | React Query | Already scalable |
| API calls | Per-request | Add request queuing |
| Offline | Network detection only | Add offline-first storage |

### Extension Points

1. **New Venue Categories**: Add to `PlaceCategory` type and `PLACE_CATEGORY_LABELS`
2. **New Travel Modes**: Extend `TravelMode` type
3. **New Providers**: Implement adapter pattern in `api/client.ts`
4. **Internationalization**: Messages already centralized in `constants/messages.ts`

### Recommended Future Improvements

1. **Offline Mode**: Cache successful search results locally
2. **User Accounts**: Store favorite locations, search history
3. **Real-time Traffic**: Integrate traffic layer for live updates
4. **Group Meetups**: Algorithm extension for 3+ participants
5. **Push Notifications**: Alert when friend arrives at venue

---

## Conclusion

MeetHalfway is built on solid foundations with React Native and Expo, emphasizing:

- **User Experience**: Progressive loading, graceful error handling, intuitive navigation
- **Performance**: Strategic caching, batch API calls, efficient rendering
- **Maintainability**: TypeScript types, centralized configuration, separation of concerns
- **Reliability**: Multiple fallback strategies, comprehensive error boundaries

The architecture balances development velocity with production readiness, making it well-suited for both rapid iteration and long-term maintenance.

---

*Document Version: 1.0*  
*Last Updated: January 2026*

