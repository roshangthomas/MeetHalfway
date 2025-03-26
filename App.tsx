import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Platform, Linking, Image, KeyboardAvoidingView, findNodeHandle, UIManager } from 'react-native';
import MapViewWrapper from './src/components/MapViewWrapper';
import { Marker, Region } from 'react-native-maps';
import { LocationInput } from './src/components/LocationInput';
import { TravelModePicker } from './src/components/TravelModePicker';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { getCurrentLocation, geocodeAddress, calculateMidpoint, calculateRoadMidpoint, findOptimalMeetingPlaces } from './src/services/location';
import { searchRestaurants, getTravelInfo } from './src/services/places';
import { Location as LocationType, Restaurant, TravelMode, PlaceCategory, RootStackParamList } from './src/types';
import { styles } from './src/styles/App.styles';
import { ERROR_MESSAGES } from './src/constants';
import { COLORS } from './src/constants/colors';
import { CategoryPicker } from './src/components/CategoryPicker';
import { LoadingOverlay } from './src/components/LoadingOverlay';
import { ResultsScreen } from './src/screens/ResultsScreen';
import { RestaurantDetailScreen } from './src/screens/RestaurantDetailScreen';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ExpoLocation from 'expo-location';
import { NoResultsScreen } from './src/screens/NoResultsScreen';
import { Ionicons } from '@expo/vector-icons';

const Stack = createStackNavigator<RootStackParamList>();

// Define props type for HomeScreen
type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

function formatAddressForDisplay(address: string | null): string {
  if (!address) return 'Current Location';

  // Try to extract city, state, country
  const parts = address.split(',').map(part => part.trim());

  // If address has at least 3 parts, return the last 3 (city, state, country)
  if (parts.length >= 3) {
    return parts.slice(Math.max(0, parts.length - 3)).join(', ');
  }

  // If address is too short, return as is
  return address;
}

function HomeScreen({ navigation, route }: HomeScreenProps) {
  const [partnerAddress, setPartnerAddress] = useState<string | null>(null);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<LocationType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'pending'>('pending');
  const [travelMode, setTravelMode] = useState<TravelMode>('driving');
  const [selectedCategories, setSelectedCategories] = useState<PlaceCategory[]>(['restaurant']);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [locationServicesEnabled, setLocationServicesEnabled] = useState<boolean | null>(null);

  // Add ScrollView ref
  const scrollViewRef = useRef<ScrollView>(null);
  const partnerLocationInputRef = useRef<View>(null);

  // Check for new location passed from ChangeLocation screen
  useEffect(() => {
    if (route.params?.newLocation && route.params?.newAddress) {
      setUserLocation(route.params.newLocation);
      setUserAddress(route.params.newAddress);
      setMapRegion({
        latitude: route.params.newLocation.latitude,
        longitude: route.params.newLocation.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });

      // Clear the parameters to avoid reapplying on subsequent renders
      navigation.setParams({ newLocation: undefined, newAddress: undefined });
    }
  }, [route.params?.newLocation, route.params?.newAddress, navigation]);

  useEffect(() => {
    // Check if location services are enabled when component mounts
    const checkLocationServices = async () => {
      const enabled = await ExpoLocation.hasServicesEnabledAsync();
      setLocationServicesEnabled(enabled);

      if (!enabled) {
        // If location services are disabled, set the appropriate permission state
        setLocationPermission('denied');
      } else {
        // Only request location if services are enabled
        getUserLocation();
      }
    };

    checkLocationServices();
  }, []);

  const getUserLocation = async () => {
    setLoading(true);
    try {
      const location = await getCurrentLocation();
      setUserLocation(location);
      setMapRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
      setLocationPermission('granted');
      setError(null);
    } catch (error) {
      console.error('Failed to get user location:', error);
      if (error instanceof Error &&
        error.message === ERROR_MESSAGES.LOCATION_PERMISSION_DENIED) {
        setLocationPermission('denied');
      }
      setError(error instanceof Error ? error.message : ERROR_MESSAGES.USER_LOCATION_UNAVAILABLE);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeLocation = () => {
    navigation.navigate('ChangeLocation', {
      previousLocation: userLocation,
      previousAddress: userAddress || ''
    });
  };

  const handleSearch = async () => {
    if (!userLocation) {
      setError(ERROR_MESSAGES.USER_LOCATION_UNAVAILABLE);
      return;
    }

    if (!partnerAddress || !partnerAddress.trim()) {
      setError(ERROR_MESSAGES.PARTNER_LOCATION_INVALID);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Geocode partner address
      let partnerLoc: LocationType;
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
      let midpoint: LocationType;
      try {
        // Use road-based midpoint calculation
        midpoint = await calculateRoadMidpoint(userLocation as LocationType, partnerLoc);
      } catch (midpointError) {
        console.warn('Road midpoint calculation failed, falling back to simple midpoint', midpointError);
        // Fallback to simple midpoint if road calculation fails
        midpoint = calculateMidpoint(userLocation as LocationType, partnerLoc);
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
          userLocation as LocationType,
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
          // Navigate to NoResults screen instead of just setting an error
          navigation.navigate('NoResults', {
            errorMessage: `No places found near the midpoint. Try different categories or locations.`
          });
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
            const restaurantLocation: LocationType = {
              latitude: restaurant.latitude,
              longitude: restaurant.longitude
            };

            const travelInfo = await getTravelInfo(userLocation as LocationType, restaurantLocation, travelMode);
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
        // Navigate to NoResults screen
        navigation.navigate('NoResults', {
          errorMessage: `No places found. Try different categories or locations.`
        });
        setLoading(false);
        return;
      }

      // Navigate to results screen with all necessary data
      navigation.navigate('Results', {
        restaurants: optimizedRestaurants,
        userLocation: userLocation as LocationType,
        partnerLocation: partnerLoc,
        midpointLocation: midpoint,
        travelMode: travelMode,
      });

    } catch (error) {
      console.error('Search error:', error);

      let errorMessage = ERROR_MESSAGES.RESTAURANT_SEARCH_FAILED;
      if (error instanceof Error) {
        // Use the specific error message if available
        errorMessage = error.message;
      }

      // Navigate to NoResults screen for general errors too
      navigation.navigate('NoResults', {
        errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to open device settings
  const openLocationSettings = () => {
    // For iOS this opens the Settings app
    // For Android this opens Location Settings
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  // Function to handle partner location input focus
  const handlePartnerLocationFocus = () => {
    // Add a small delay to ensure the keyboard is showing
    setTimeout(() => {
      if (partnerLocationInputRef.current && scrollViewRef.current) {
        // Find the position of the partner location input and scroll to it
        partnerLocationInputRef.current.measureInWindow((x, y, width, height) => {
          // Scroll to the position plus some extra space for the dropdown
          const yOffset = y + 150; // Adding extra space for dropdown
          scrollViewRef.current?.scrollTo({ y: yOffset, animated: true });
        });
      }
    }, 300);
  };

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container}>
        <LoadingOverlay visible={loading} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingContainer}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollViewContent}
          >
            <View style={styles.content}>
              {userLocation && (
                <View style={styles.mapContainer}>
                  <MapViewWrapper
                    style={styles.map}
                    region={mapRegion || undefined}
                  >
                    {userLocation && (
                      <Marker
                        coordinate={{
                          latitude: (userLocation as LocationType).latitude,
                          longitude: (userLocation as LocationType).longitude,
                        }}
                        title="Your Location"
                      />
                    )}
                  </MapViewWrapper>
                </View>
              )}

              <View style={styles.inputContainer}>
                {userLocation && (
                  <>
                    <View style={styles.userLocationContainer}>
                      <Text style={styles.label}>Your Location:</Text>
                      <View style={styles.locationInfoContainer}>
                        <Text style={styles.locationText} numberOfLines={1} ellipsizeMode="tail">
                          {formatAddressForDisplay(userAddress || "Current Location")}
                        </Text>
                        <TouchableOpacity
                          style={[styles.button, styles.secondaryButton, styles.changeLocationButton]}
                          onPress={handleChangeLocation}
                        >
                          <Text style={styles.secondaryButtonText}>
                            Change
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <Text style={styles.label}>Partner's Location:</Text>
                    <View ref={partnerLocationInputRef}>
                      <LocationInput
                        value={partnerAddress || ''}
                        onChangeText={setPartnerAddress}
                        placeholder="Enter partner's location..."
                        onInputFocus={handlePartnerLocationFocus}
                      />
                    </View>

                    <TravelModePicker
                      selectedMode={travelMode}
                      onModeChange={setTravelMode}
                    />

                    <CategoryPicker
                      selectedCategories={selectedCategories}
                      onCategoriesChange={setSelectedCategories}
                    />

                    <View style={styles.findButtonContainer}>
                      <TouchableOpacity
                        style={[
                          styles.findButton,
                          (!partnerAddress || loading) && styles.buttonDisabled
                        ]}
                        onPress={handleSearch}
                        disabled={loading || !partnerAddress}
                      >
                        <Text style={styles.findButtonText}>
                          Find Meeting Point & Places
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>

              {/* Show either the general error or the location permission error */}
              {(error || locationPermission === 'denied') && (
                <Text style={styles.error}>
                  {error || ERROR_MESSAGES.LOCATION_PERMISSION_DENIED}
                </Text>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ErrorBoundary>
  );
}

// Define props type for ChangeLocationScreen
type ChangeLocationScreenProps = NativeStackScreenProps<RootStackParamList, 'ChangeLocation'>;

function ChangeLocationScreen({ navigation, route }: ChangeLocationScreenProps) {
  const [userAddress, setUserAddress] = useState('');
  const [userLocation, setUserLocation] = useState<LocationType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'pending'>('pending');
  const [locationServicesEnabled, setLocationServicesEnabled] = useState<boolean | null>(null);

  // Add ScrollView ref
  const scrollViewRef = useRef<ScrollView>(null);
  const locationInputRef = useRef<View>(null);

  useEffect(() => {
    // Check if location services are enabled when component mounts
    const checkLocationServices = async () => {
      const enabled = await ExpoLocation.hasServicesEnabledAsync();
      setLocationServicesEnabled(enabled);

      if (!enabled) {
        // If location services are disabled, set the appropriate permission state
        setLocationPermission('denied');
      }
    };

    checkLocationServices();
  }, []);

  // Function to handle location input focus
  const handleLocationFocus = () => {
    // Add a small delay to ensure the keyboard is showing
    setTimeout(() => {
      if (locationInputRef.current && scrollViewRef.current) {
        // Find the position of the location input and scroll to it
        locationInputRef.current.measureInWindow((x, y, width, height) => {
          // Scroll to the position plus some extra space for the dropdown
          const yOffset = y + 150; // Adding extra space for dropdown
          scrollViewRef.current?.scrollTo({ y: yOffset, animated: true });
        });
      }
    }, 300);
  };

  const getUserLocation = async () => {
    setLoading(true);
    try {
      const location = await getCurrentLocation();
      setUserLocation(location);
      setLocationPermission('granted');
      setError(null);

      // Auto-navigate back to home screen with new location
      navigation.navigate('Home', {
        newLocation: location,
        newAddress: "Current Location"
      });

    } catch (error) {
      console.error('Failed to get user location:', error);
      if (error instanceof Error &&
        error.message === ERROR_MESSAGES.LOCATION_PERMISSION_DENIED) {
        setLocationPermission('denied');
      }
      setError(error instanceof Error ? error.message : ERROR_MESSAGES.USER_LOCATION_UNAVAILABLE);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAddressSubmit = async () => {
    if (!userAddress.trim()) {
      setError('Please enter your location');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const geocodedLocation = await geocodeAddress(userAddress);
      setUserLocation(geocodedLocation);

      // Navigate back to home screen with new location
      navigation.navigate('Home', {
        newLocation: geocodedLocation,
        newAddress: userAddress
      });

    } catch (error) {
      console.error('Failed to geocode user address:', error);
      setError(error instanceof Error ? error.message : ERROR_MESSAGES.GEOCODING_FAILED);
    } finally {
      setLoading(false);
    }
  };

  // Function to open device settings
  const openLocationSettings = () => {
    // For iOS this opens the Settings app
    // For Android this opens Location Settings
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container}>
        <LoadingOverlay visible={loading} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingContainer}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollViewContent}
          >
            <View style={styles.content}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Your Location:</Text>
                <View ref={locationInputRef}>
                  <LocationInput
                    value={userAddress}
                    onChangeText={setUserAddress}
                    placeholder="Enter your location..."
                    onInputFocus={handleLocationFocus}
                  />
                </View>
                <TouchableOpacity
                  style={[
                    styles.button,
                    (!userAddress || loading) && styles.buttonDisabled
                  ]}
                  onPress={handleUserAddressSubmit}
                  disabled={loading || !userAddress}
                >
                  <Text style={styles.buttonText}>
                    Set My Location
                  </Text>
                </TouchableOpacity>

                {locationPermission === 'denied' && (
                  <TouchableOpacity
                    style={[styles.button, styles.warningButton]}
                    onPress={openLocationSettings}
                  >
                    <Text style={styles.buttonText}>
                      Enable Location Services
                    </Text>
                  </TouchableOpacity>
                )}

                {locationPermission !== 'denied' && (
                  <TouchableOpacity
                    style={[styles.button, styles.secondaryButton]}
                    onPress={getUserLocation}
                  >
                    <Text style={styles.secondaryButtonText}>
                      Use My Current Location
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Show error message if any */}
              {error && (
                <Text style={styles.error}>
                  {error}
                </Text>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
          name="ChangeLocation"
          component={ChangeLocationScreen}
          options={{
            title: 'Change Location',
            headerBackTitle: 'Home'
          }}
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
        <Stack.Screen
          name="NoResults"
          component={NoResultsScreen}
          options={{ title: 'No Results', headerLeft: () => null }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}