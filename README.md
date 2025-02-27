# MeetHalfway

A React Native app that helps two people find restaurants at a convenient midpoint location between them.

## Features

- Gets your current location
- Lets you input a second location
- Finds the midpoint between both locations
- Searches for restaurants near the midpoint
- Shows travel time and distance to each restaurant
- Displays everything on an interactive map

## Prerequisites

- Node.js (v14 or newer)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for Mac) or Android Emulator
- Google Maps API key with the following APIs enabled:
  - Maps SDK for iOS/Android
  - Places API
  - Directions API
  - Geocoding API

## Setup

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd MeetHalfway
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with your Google API key:
   ```
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   ```
   Note: The same API key is used for all Google services (Maps, Places, Directions, and Geocoding)

4. Start the development server:
   ```bash
   npx expo start
   ```

5. Press 'i' for iOS simulator or 'a' for Android emulator

## Location Permissions

The app requires location permissions to function:

- iOS: The first time you run the app, it will prompt for location permissions
- Android: You may need to manually enable location permissions in Settings > Apps > MeetHalfway > Permissions

## Customization

- Modify the search radius in `src/services/PlacesService.ts`
- Adjust the map style in `src/components/Map.tsx`
- Change the travel modes in `src/components/TravelModePicker.tsx`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details 