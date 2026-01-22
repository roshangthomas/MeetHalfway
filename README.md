<p align="center">
  <img src="assets/icon.png" alt="MeetHalfway Logo" width="120" height="120">
</p>

<h1 align="center">MeetHalfway</h1>

<p align="center">
  <strong>Find the perfect meeting spot between two locations</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#how-it-works">How It Works</a> •
  <a href="#installation">Installation</a> •
  <a href="#configuration">Configuration</a> •
  <a href="#usage">Usage</a> •
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-0.76.7-61DAFB?logo=react" alt="React Native">
  <img src="https://img.shields.io/badge/Expo-52-000020?logo=expo" alt="Expo">
  <img src="https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Platform-iOS%20%7C%20Android-lightgrey" alt="Platform">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
</p>

---

## Overview

MeetHalfway is a React Native mobile app that helps two people find convenient meeting places at a fair midpoint between their locations. Whether you're meeting a friend, planning a date, or coordinating a business lunch, MeetHalfway finds venues where both parties travel roughly the same distance.

---

## Features

- **Smart Midpoint Calculation** — Calculates the midpoint based on actual road distance, not just geographic center
- **Multi-Category Search** — Find restaurants, cafes, bars, parks, shopping malls, and movie theaters
- **Travel Mode Options** — Get results optimized for driving, walking, transit, or bicycling
- **Fairness Scoring** — Ranks venues by how fair the travel time is for both parties
- **Dual Travel Info** — Shows travel time and distance from both starting points
- **Interactive Maps** — View all results on an integrated Google Maps interface
- **Filtering & Sorting** — Filter by rating, reviews, price level; sort by distance, rating, fairness
- **Place Details** — View business hours, phone numbers, and open/closed status
- **Share & Navigate** — Share locations and get turn-by-turn directions in your preferred maps app
- **Offline Detection** — Graceful handling when network connectivity is lost
- **Smooth Animations** — Polished loading states with Lottie animations

---

## How It Works

### 1. Road-Based Midpoint Calculation
The app doesn't just find the geographic center—it calculates the true midpoint along the actual driving route:
- Fetches the route between both locations via Google Directions API
- Calculates total route distance
- Finds the exact point that's halfway along the road

### 2. Venue Discovery & Optimization
Once the midpoint is found, the app searches for venues and ranks them intelligently:
- Searches multiple categories near the midpoint
- Calculates travel times from **both** starting points to each venue
- Scores venues using a weighted algorithm:
  - **50%** Fairness (minimal difference in travel times)
  - **30%** Quality (venue ratings and reviews)
  - **20%** Convenience (total combined travel time)

### 3. Smart Sorting Options
- **Best Match** — Balanced score considering all factors
- **Most Fair** — Smallest difference in travel times
- **Highest Rated** — Best reviewed venues
- **Shortest Distance** — Quickest to reach

---

## Screenshots

<p align="center">
  <em>Coming soon</em>
</p>

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React Native 0.76 with Expo SDK 52 |
| Language | TypeScript 5.3 |
| Navigation | React Navigation 6 |
| Maps | react-native-maps with Google Maps |
| HTTP Client | Axios |
| Animations | Lottie (lottie-react-native) |
| State | React Hooks |
| Location | expo-location |
| Network Status | @react-native-community/netinfo |
| Storage | @react-native-async-storage/async-storage |

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** v18 or newer
- **npm** or **yarn**
- **Expo CLI** (`npm install -g expo-cli`)
- **iOS Simulator** (macOS only) or **Android Emulator**
- **Google Cloud Platform Account** with billing enabled

### Required Google APIs

Enable these APIs in your [Google Cloud Console](https://console.cloud.google.com/):

- Maps SDK for iOS
- Maps SDK for Android
- Places API
- Directions API
- Geocoding API

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/MeetHalfway.git
cd MeetHalfway
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```bash
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
```

> **Note:** Both variables can use the same API key if your key has all required APIs enabled.

### 4. iOS Setup (macOS only)

```bash
cd ios
pod install
cd ..
```

### 5. Start the Development Server

```bash
npm start
```

---

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_MAPS_API_KEY` | Google Maps API key for maps display | Yes |
| `GOOGLE_PLACES_API_KEY` | Google Places API key for venue search | Yes |

### Customization Options

| File | What You Can Customize |
|------|----------------------|
| `src/services/location.ts` | Search radius, scoring weights |
| `src/constants/colors.ts` | App color scheme |
| `src/types.ts` | Place categories |
| `src/components/TravelModePicker.tsx` | Available travel modes |

---

## Usage

### Running on iOS Simulator

```bash
npm run ios
```

### Running on Android Emulator

```bash
npm run android
```

### Running on Physical Device

1. Install **Expo Go** from the App Store or Play Store
2. Run `npm start`
3. Scan the QR code with Expo Go (Android) or Camera app (iOS)

---

## Project Structure

```
MeetHalfway/
├── App.tsx                    # App entry point & navigation setup
├── src/
│   ├── api/
│   │   └── client.ts          # Axios client configuration
│   ├── components/
│   │   ├── AnimatedSplash.tsx # Splash screen animation
│   │   ├── CategoryPicker.tsx # Place category selection
│   │   ├── ErrorBoundary.tsx  # Error handling wrapper
│   │   ├── FilterModal.tsx    # Results filtering UI
│   │   ├── LoadingOverlay.tsx # Loading state overlay
│   │   ├── LocationInput.tsx  # Address autocomplete input
│   │   ├── Map.tsx            # Google Maps component
│   │   ├── OfflineNotice.tsx  # Network status banner
│   │   ├── RestaurantList.tsx # Venue results list
│   │   ├── SortModal.tsx      # Results sorting UI
│   │   └── TravelModePicker.tsx
│   ├── constants/
│   │   ├── colors.ts          # Color palette
│   │   └── index.ts           # App constants
│   ├── hooks/
│   │   ├── useDebounce.ts     # Debounce hook
│   │   └── useLocationPermission.ts
│   ├── screens/
│   │   ├── HomeScreen.tsx     # Main search screen
│   │   ├── ResultsScreen.tsx  # Search results
│   │   ├── RestaurantDetailScreen.tsx
│   │   ├── ChangeLocationScreen.tsx
│   │   ├── LocationPermissionScreen.tsx
│   │   └── NoResultsScreen.tsx
│   ├── services/
│   │   ├── location.ts        # Location & midpoint logic
│   │   └── places.ts          # Google Places API calls
│   ├── styles/
│   │   ├── App.styles.ts
│   │   └── Results.styles.ts
│   ├── types/
│   │   ├── api.ts             # API response types
│   │   └── env.d.ts           # Environment type definitions
│   ├── utils/
│   │   ├── duration.ts        # Time parsing utilities
│   │   ├── formatting.ts      # Display formatters
│   │   ├── logger.ts          # Logging utility
│   │   └── settings.ts        # Device settings helpers
│   └── types.ts               # Shared TypeScript types
├── assets/                    # Images, icons, animations
├── android/                   # Android native code
├── ios/                       # iOS native code
└── package.json
```

---

## Building for Production

### Using EAS Build (Recommended)

#### 1. Install EAS CLI

```bash
npm install -g eas-cli
eas login
```

#### 2. Store API Keys Securely

```bash
eas secret:create --scope project --name GOOGLE_MAPS_API_KEY --value "YOUR_API_KEY"
```

#### 3. Build for Android

```bash
eas build --platform android --profile production
```

#### 4. Build for iOS

```bash
eas build --platform ios --profile production
```

### Local Builds

#### Android APK

```bash
cd android
./gradlew assembleRelease
```

#### iOS Archive

```bash
cd ios
xcodebuild -workspace MeetHalfway.xcworkspace -scheme MeetHalfway archive
```

---

## Location Permissions

The app requires location access to function:

| Platform | Permission Level | Notes |
|----------|-----------------|-------|
| iOS | When In Use | Prompted on first launch |
| Android | Fine Location | May need manual enable in Settings |

### Troubleshooting Permissions

**iOS:**
- Go to Settings > Privacy > Location Services > MeetHalfway

**Android:**
- Go to Settings > Apps > MeetHalfway > Permissions > Location

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Map not loading | Verify Google Maps API key is correct and has required APIs enabled |
| "OVER_QUERY_LIMIT" error | Check your Google Cloud billing and API quotas |
| Location not found | Ensure location permissions are granted and GPS is enabled |
| Build fails on iOS | Run `cd ios && pod install && cd ..` |
| Metro bundler errors | Clear cache with `npm start -- --reset-cache` |

### Clearing Cache

```bash
# Clear Metro bundler cache
npm start -- --reset-cache

# Clear Watchman cache (macOS)
watchman watch-del-all

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules
npm install
```

---

## API Rate Limits

Be mindful of Google API quotas:

| API | Free Tier | Notes |
|-----|-----------|-------|
| Places API | $200/month credit | ~5,000 requests |
| Directions API | $200/month credit | ~40,000 requests |
| Geocoding API | $200/month credit | ~40,000 requests |

Consider implementing caching for production use.

---

## Contributing

We welcome contributions! Here's how to get started:

### 1. Fork the Repository

Click the "Fork" button on GitHub.

### 2. Create a Feature Branch

```bash
git checkout -b feature/amazing-feature
```

### 3. Make Your Changes

Follow the existing code style and patterns.

### 4. Test Your Changes

```bash
npm start
# Test on both iOS and Android
```

### 5. Commit and Push

```bash
git commit -m "Add amazing feature"
git push origin feature/amazing-feature
```

### 6. Open a Pull Request

Submit a PR with a clear description of your changes.

---

## Roadmap

- [ ] Offline mode with cached results
- [ ] User accounts and favorite locations
- [ ] Group meetups (3+ people)
- [ ] Real-time traffic consideration
- [ ] Venue reservations integration
- [ ] Dark mode support

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [Google Maps Platform](https://developers.google.com/maps) for location services
- [Expo](https://expo.dev) for the amazing React Native toolchain
- [LottieFiles](https://lottiefiles.com) for animation assets

---

<p align="center">
  Made with ❤️ for people who want to meet in the middle
</p>
