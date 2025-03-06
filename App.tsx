import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import MapViewWrapper from './src/components/MapViewWrapper';
import { Marker } from 'react-native-maps';
import { LocationInput } from './src/components/LocationInput';
import { TravelModePicker } from './src/components/TravelModePicker';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { getCurrentLocation, geocodeAddress, calculateMidpoint, calculateRoadMidpoint, findOptimalMeetingPlaces } from './src/services/location';
import { searchRestaurants, getTravelInfo } from './src/services/places';
import { Location, Restaurant, TravelMode, PlaceCategory, RootStackParamList } from './src/types';
import { styles } from './src/styles/App.styles';
import { ERROR_MESSAGES } from './src/constants';
import { CategoryPicker } from './src/components/CategoryPicker';
import { LoadingOverlay } from './src/components/LoadingOverlay';
import { ResultsScreen } from './src/screens/ResultsScreen';
import { RestaurantDetailScreen } from './src/screens/RestaurantDetailScreen';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

const Stack = createStackNavigator<RootStackParamList>();

// Define props type for HomeScreen
type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

function HomeScreen({ navigation }: HomeScreenProps) {
  const [partnerAddress, setPartnerAddress] = useState('');
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [travelMode, setTravelMode] = useState<TravelMode>('driving');
  const [selectedCategories, setSelectedCategories] = useState<PlaceCategory[]>(['restaurant']);
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.94565601059843,
    longitude: -121.98505722883536,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    // Initialize with hardcoded location immediately
    const location = {
      latitude: 37.94565601059843,
      longitude: -121.98505722883536,
    };
    setUserLocation(location);
  }, []);

  const handleSearch = async () => {
    if (!userLocation) {
      setError(ERROR_MESSAGES.USER_LOCATION_UNAVAILABLE);
      return;
    }

    if (!partnerAddress.trim()) {
      setError(ERROR_MESSAGES.PARTNER_LOCATION_INVALID);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Geocode partner address
      let partnerLoc;
      try {
        partnerLoc = await geocodeAddress(partnerAddress);
      } catch (geocodeError) {
        if (geocodeError instanceof Error) {
          setError(geocodeError.message);
        } else {
          setError(ERROR_MESSAGES.GEOCODING_FAILED);
        }
        setLoading(false);
        return;
      }

      // Calculate midpoint based on road distance
      let midpoint;
      try {
        // Use road-based midpoint calculation
        midpoint = await calculateRoadMidpoint(userLocation, partnerLoc);
      } catch (midpointError) {
        console.warn('Road midpoint calculation failed, falling back to simple midpoint', midpointError);
        // Fallback to simple midpoint if road calculation fails
        midpoint = calculateMidpoint(userLocation, partnerLoc);
      }

      // Update map region to show the midpoint
      setMapRegion({
        latitude: midpoint.latitude,
        longitude: midpoint.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });

      // Find optimal meeting places
      let optimizedRestaurants;
      try {
        optimizedRestaurants = await findOptimalMeetingPlaces(
          userLocation,
          partnerLoc,
          travelMode,
          selectedCategories,
          20 // Maximum number of results
        );
      } catch (searchError) {
        // If optimized search fails, fall back to the original approach
        console.warn('Optimized venue search failed, falling back to simple search', searchError);

        // Fetch restaurants near the midpoint for each selected category
        let allRestaurants: Restaurant[] = [];

        try {
          for (const category of selectedCategories) {
            const categoryRestaurants = await searchRestaurants(midpoint, category);
            allRestaurants = [...allRestaurants, ...categoryRestaurants];
          }
        } catch (error) {
          if (error instanceof Error) {
            setError(error.message);
          } else {
            setError(ERROR_MESSAGES.RESTAURANT_SEARCH_FAILED);
          }
          setLoading(false);
          return;
        }

        // If no restaurants found
        if (allRestaurants.length === 0) {
          setError(`No places found near the midpoint. Try different categories or locations.`);
          setLoading(false);
          return;
        }

        // Remove duplicates (in case a place appears in multiple categories)
        allRestaurants = allRestaurants.filter((restaurant, index, self) =>
          index === self.findIndex((r) => r.id === restaurant.id)
        );

        // Sort by rating (highest first)
        allRestaurants.sort((a, b) => (b.rating || 0) - (a.rating || 0));

        // Limit to top 20 results
        allRestaurants = allRestaurants.slice(0, 20);

        // Add travel information for each restaurant
        const travelPromises = allRestaurants.map(async (restaurant) => {
          try {
            const restaurantLocation = {
              latitude: restaurant.latitude,
              longitude: restaurant.longitude
            };

            const travelInfo = await getTravelInfo(userLocation, restaurantLocation, travelMode);
            restaurant.distance = travelInfo.distance;
            restaurant.duration = travelInfo.duration;
            return restaurant;
          } catch (error) {
            console.error('Failed to get travel info for restaurant:', restaurant.name);
            restaurant.distance = 'Unknown';
            restaurant.duration = 'Unknown';
            return restaurant;
          }
        });

        // Wait for all travel info requests to complete
        optimizedRestaurants = await Promise.all(travelPromises);
      }

      // If no restaurants found after all attempts
      if (!optimizedRestaurants || optimizedRestaurants.length === 0) {
        setError(`No places found. Try different categories or locations.`);
        setLoading(false);
        return;
      }

      // Navigate to results screen with all necessary data
      navigation.navigate('Results', {
        restaurants: optimizedRestaurants,
        userLocation,
        partnerLocation: partnerLoc,
        midpointLocation: midpoint,
        travelMode: travelMode,
      });

    } catch (error) {
      console.error('Search error:', error);

      if (error instanceof Error) {
        // Use the specific error message if available
        setError(error.message);
      } else {
        // Default error message
        setError(ERROR_MESSAGES.RESTAURANT_SEARCH_FAILED);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container}>
        <LoadingOverlay visible={loading} />
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            {userLocation && (
              <View style={styles.mapContainer}>
                <MapViewWrapper
                  style={styles.map}
                  region={mapRegion}
                >
                  {userLocation && (
                    <Marker
                      coordinate={{
                        latitude: userLocation.latitude,
                        longitude: userLocation.longitude,
                      }}
                      title="Your Location"
                    />
                  )}
                </MapViewWrapper>
              </View>
            )}

            <View style={styles.inputContainer}>
              <LocationInput
                value={partnerAddress}
                onChangeText={setPartnerAddress}
                placeholder="Enter partner's location..."
              />

              <TravelModePicker
                selectedMode={travelMode}
                onModeChange={setTravelMode}
              />

              <CategoryPicker
                selectedCategories={selectedCategories}
                onCategoriesChange={setSelectedCategories}
              />

              <TouchableOpacity
                style={[
                  styles.button,
                  (!partnerAddress || loading) && styles.buttonDisabled
                ]}
                onPress={handleSearch}
                disabled={loading || !partnerAddress}
              >
                <Text style={styles.buttonText}>
                  Find Meeting Point & Places
                </Text>
              </TouchableOpacity>
            </View>

            {error && <Text style={styles.error}>{error}</Text>}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Meet Halfway' }}
        />
        <Stack.Screen
          name="Results"
          component={ResultsScreen}
          options={{ title: 'Meeting Places' }}
        />
        <Stack.Screen
          name="RestaurantDetail"
          component={RestaurantDetailScreen}
          options={({ route }) => ({ title: route.params.restaurant.name })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}