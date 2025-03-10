import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import MapViewWrapper from './src/components/MapViewWrapper';
import { Marker } from 'react-native-maps';
import { LocationInput } from './src/components/LocationInput';
import { TravelModePicker } from './src/components/TravelModePicker';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { getCurrentLocation, geocodeAddress, calculateMidpoint, calculateRoadMidpoint, calculateMultiPointMidpoint, findOptimalMeetingPlaces } from './src/services/location';
import { searchRestaurants, getTravelInfo } from './src/services/places';
import { Location, Restaurant, TravelMode, PlaceCategory, RootStackParamList } from './src/types';
import { styles } from './src/styles/App.styles';
import { ERROR_MESSAGES } from './src/constants';
import { CategoryPicker } from './src/components/CategoryPicker';
import { LoadingOverlay } from './src/components/LoadingOverlay';
import { ResultsScreen } from './src/screens/ResultsScreen';
import { RestaurantDetailScreen } from './src/screens/RestaurantDetailScreen';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

const Stack = createStackNavigator<RootStackParamList>();

// Define props type for HomeScreen
type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

function HomeScreen({ navigation }: HomeScreenProps) {
  // Replace single partnerAddress with an array of addresses
  const [partnerAddresses, setPartnerAddresses] = useState<string[]>(['']);
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

  // Function to update a specific address
  const updateAddress = (index: number, value: string) => {
    const newAddresses = [...partnerAddresses];
    newAddresses[index] = value;
    setPartnerAddresses(newAddresses);
  };

  // Function to add a new address input (up to max 2 additional addresses)
  const addAddressInput = () => {
    if (partnerAddresses.length < 3) {
      setPartnerAddresses([...partnerAddresses, '']);
    }
  };

  // Function to remove an address input
  const removeAddressInput = (index: number) => {
    const newAddresses = [...partnerAddresses];
    newAddresses.splice(index, 1);
    setPartnerAddresses(newAddresses);
  };

  const handleSearch = async () => {
    if (!userLocation) {
      setError(ERROR_MESSAGES.USER_LOCATION_UNAVAILABLE);
      return;
    }

    // Filter out empty addresses
    const validAddresses = partnerAddresses.filter(addr => addr.trim() !== '');

    if (validAddresses.length === 0) {
      setError(ERROR_MESSAGES.PARTNER_LOCATION_INVALID);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Geocode all partner addresses
      const partnerLocations: Location[] = [];

      for (const address of validAddresses) {
        try {
          const location = await geocodeAddress(address);
          partnerLocations.push(location);
        } catch (geocodeError) {
          if (geocodeError instanceof Error) {
            setError(geocodeError.message);
          } else {
            setError(ERROR_MESSAGES.GEOCODING_FAILED);
          }
          setLoading(false);
          return;
        }
      }

      // Calculate midpoint based on all locations (including user location)
      let midpoint;
      try {
        // Use multi-point midpoint calculation
        const allLocations = [userLocation, ...partnerLocations];
        midpoint = await calculateMultiPointMidpoint(allLocations, travelMode);
      } catch (midpointError) {
        console.warn('Multi-point midpoint calculation failed, falling back to simple midpoint', midpointError);
        // Fallback to simple midpoint if calculation fails
        const allLocations = [userLocation, ...partnerLocations];
        midpoint = calculateMidpoint(allLocations);
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
          [userLocation, ...partnerLocations],
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
        partnerLocations: partnerLocations,
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
              {/* Render address inputs */}
              {partnerAddresses.map((address, index) => (
                <View key={index} style={styles.addressInputRow}>
                  <LocationInput
                    value={address}
                    onChangeText={(text) => updateAddress(index, text)}
                    placeholder={`Enter ${index === 0 ? "partner's" : `additional person's`} location...`}
                  />

                  {/* Show remove button for all but the first address */}
                  {index > 0 && (
                    <TouchableOpacity
                      style={styles.removeAddressButton}
                      onPress={() => removeAddressInput(index)}
                    >
                      <Ionicons name="close-circle" size={24} color="red" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              {/* Add Address button - only show if we have fewer than 3 addresses */}
              {partnerAddresses.length < 3 && (
                <TouchableOpacity
                  style={styles.addAddressButton}
                  onPress={addAddressInput}
                >
                  <Text style={styles.addAddressButtonText}>
                    <Ionicons name="add-circle-outline" size={16} /> Add Another Address
                  </Text>
                </TouchableOpacity>
              )}

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
                  (!partnerAddresses[0] || loading) && styles.buttonDisabled
                ]}
                onPress={handleSearch}
                disabled={loading || !partnerAddresses[0]}
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