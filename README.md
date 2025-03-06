# MeetHalfway

A React Native app that helps two people find restaurants at a convenient midpoint location between them.

## Features

- Gets your current location
- Lets you input a second location
- Finds the midpoint between both locations based on actual road distance
- Searches for restaurants near the midpoint
- Optimizes venue selection based on travel times for both parties
- Ranks venues by fairness, rating, and overall experience
- Shows travel time and distance to each restaurant for both people
- Displays everything on an interactive map

## How It Works

The app uses a sophisticated algorithm to find the best meeting places:

1. **Road-Based Midpoint Calculation**:
   - Gets directions between the two locations using Google Directions API
   - Calculates the total route distance
   - Finds the point that's exactly halfway along the route

2. **Venue Optimization**:
   - Searches for restaurants and other venues near the midpoint
   - Calculates travel times from both starting points to each venue
   - Ranks venues using a weighted scoring system that considers:
     - Fairness (minimal difference in travel times)
     - Venue quality (ratings)
     - Total travel time

3. **Smart Sorting Options**:
   - Best Match: Balanced score of fairness, rating, and travel time
   - Most Fair: Venues with the smallest difference in travel times
   - Highest Rated: Venues with the best reviews
   - Travel Time: Venues with the shortest travel time

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

## Setup Instructions

1. Clone the repository
2. Copy `.env.example` to `.env`
3. Add your API keys to `.env`
4. Run `npm install`
5. Start the project with `npm start`

## Environment Variables Required:
- GOOGLE_MAPS_API_KEY
- GOOGLE_PLACES_API_KEY

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