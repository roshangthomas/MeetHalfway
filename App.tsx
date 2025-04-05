import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Platform, Linking, Image, KeyboardAvoidingView, findNodeHandle, UIManager, Alert, AppState } from 'react-native';
import MapViewWrapper from './src/components/MapViewWrapper';
import { Marker, Region } from 'react-native-maps';
import { LocationInput } from './src/components/LocationInput';
import { TravelModePicker } from './src/components/TravelModePicker';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { OfflineNotice } from './src/components/OfflineNotice';
import { getCurrentLocation, geocodeAddress, calculateMidpoint, calculateRoadMidpoint, findOptimalMeetingPlaces, checkPreciseLocationPermission, LocationPermissionStatus } from './src/services/location';
import { searchRestaurants, getTravelInfo } from './src/services/places';
import { Location as LocationType, Restaurant, TravelMode, PlaceCategory, RootStackParamList } from './src/types';
import { styles } from './src/styles/App.styles';
import { ERROR_MESSAGES } from './src/constants/index';
import { CategoryPicker } from './src/components/CategoryPicker';
import { LoadingOverlay } from './src/components/LoadingOverlay';
import { ResultsScreen } from './src/screens/ResultsScreen';
import { RestaurantDetailScreen } from './src/screens/RestaurantDetailScreen';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ExpoLocation from 'expo-location';
import { NoResultsScreen } from './src/screens/NoResultsScreen';
import { Header } from '@react-navigation/elements';
import { LocationPermissionScreen } from './src/screens/LocationPermissionScreen';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from './src/constants/colors';
import * as SplashScreen from 'expo-splash-screen';
import { AnimatedSplash } from './src/components/AnimatedSplash';

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
  const [locationPermission, setLocationPermission] = useState<LocationPermissionStatus>('pending');
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

  // Set default map region if none exists but we have userLocation
  useEffect(() => {
    if (userLocation && !mapRegion) {
      setMapRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    }
  }, [userLocation, mapRegion]);

  useEffect(() => {
    // Check if location services are enabled when component mounts
    const checkLocationServices = async () => {
      // If we already have a location from params or userAddress is set, skip location services check
      if ((route.params?.newLocation && route.params?.newAddress) || userAddress) {
        return;
      }

      const enabled = await ExpoLocation.hasServicesEnabledAsync();
      setLocationServicesEnabled(enabled);

      if (!enabled) {
        // If location services are disabled, set the appropriate permission state
        setLocationPermission('denied');
        // Navigate to LocationPermission screen
        navigation.reset({
          index: 0,
          routes: [{ name: 'LocationPermission' }],
        });
      } else {
        // Only request location if services are enabled
        getUserLocation();
      }
    };

    // Add a small delay before checking location services to prioritize UI rendering
    const timerId = setTimeout(() => {
      checkLocationServices();
    }, 100);

    return () => clearTimeout(timerId);
  }, [navigation, route.params?.newLocation, route.params?.newAddress, userAddress]);

  const getUserLocation = async () => {
    // If we already have a manual location set, don't attempt to get current location
    if (userAddress) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // First check the precise location permission status
      const permissionStatus = await checkPreciseLocationPermission();
      setLocationPermission(permissionStatus);

      if (permissionStatus === 'denied') {
        // Navigate to LocationPermission screen with no way to go back if completely denied
        navigation.reset({
          index: 0,
          routes: [{ name: 'LocationPermission' }],
        });
        throw new Error(ERROR_MESSAGES.LOCATION_PERMISSION_DENIED);
      }

      // Call getCurrentLocation which now handles both precise and approximate permissions
      const location = await getCurrentLocation();
      setUserLocation(location);
      setMapRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });

      // Set error to null as we successfully got location (even if approximate)
      setError(null);
    } catch (error) {
      console.error('Failed to get user location:', error);
      if (error instanceof Error &&
        error.message === ERROR_MESSAGES.LOCATION_PERMISSION_DENIED) {
        setLocationPermission('denied');

        // Only redirect to permission screen if we don't already have a user address
        if (!userAddress) {
          // Navigate to LocationPermission screen with no way to go back
          navigation.reset({
            index: 0,
            routes: [{ name: 'LocationPermission' }],
          });
          setError(error instanceof Error ? error.message : ERROR_MESSAGES.USER_LOCATION_UNAVAILABLE);
        }
      } else {
        setError(error instanceof Error ? error.message : ERROR_MESSAGES.USER_LOCATION_UNAVAILABLE);
      }
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

  // Add a function to upgrade to precise location
  const promptForPreciseLocation = () => {
    Alert.alert(
      "Precise Location Needed",
      "For better accuracy, please enable precise location in your device settings.",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => {
            console.log("User canceled precise location permission prompt");
            // User explicitly declined to improve location precision
            // We continue with approximate location - no action needed
          }
        },
        {
          text: "Open Settings",
          onPress: () => {
            // Track that settings were opened for location permissions
            openLocationSettings();

            // Add listener for when app comes back to foreground
            const appStateSubscription = AppState.addEventListener('change', async (nextAppState: string) => {
              if (nextAppState === 'active') {
                // App has returned to foreground, check permission status again
                console.log("App returned to foreground, checking location permissions");
                // Remove the listener to avoid multiple checks
                appStateSubscription.remove();

                // Re-check precise location permission
                const newPermissionStatus = await checkPreciseLocationPermission();
                if (newPermissionStatus === 'limited') {
                  // User returned without upgrading to precise location
                  console.log("User returned from settings but still has limited location precision");
                  // Update state to ensure UI still shows the warning
                  setLocationPermission('limited');
                } else if (newPermissionStatus === 'granted') {
                  // User successfully upgraded to precise location
                  console.log("User upgraded to precise location");
                  setLocationPermission('granted');
                  // Refresh location with precise coordinates
                  getUserLocation();
                }
              }
            });
          }
        }
      ]
    );
  };

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container}>
        <LoadingOverlay visible={loading} />
        <OfflineNotice />
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
              {/* Limited location precision warning for Android */}
              {locationPermission === 'limited' && Platform.OS === 'android' && (
                <TouchableOpacity
                  style={styles.warningBanner}
                  onPress={promptForPreciseLocation}
                >
                  <Ionicons name="warning-outline" size={18} color={COLORS.PRIMARY} />
                  <Text style={styles.warningText}>
                    {ERROR_MESSAGES.LOCATION_PRECISION_LIMITED}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.PRIMARY} />
                </TouchableOpacity>
              )}

              {userLocation && (
                <View style={styles.mapContainer}>
                  <MapViewWrapper
                    style={styles.map}
                    region={mapRegion || {
                      latitude: userLocation.latitude,
                      longitude: userLocation.longitude,
                      latitudeDelta: 0.0922,
                      longitudeDelta: 0.0421,
                    }}
                    initialRegion={{
                      latitude: userLocation.latitude,
                      longitude: userLocation.longitude,
                      latitudeDelta: 0.0922,
                      longitudeDelta: 0.0421,
                    }}
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
  const [locationPermission, setLocationPermission] = useState<LocationPermissionStatus>('pending');
  const [locationServicesEnabled, setLocationServicesEnabled] = useState<boolean | null>(null);

  // Add ScrollView ref
  const scrollViewRef = useRef<ScrollView>(null);
  const locationInputRef = useRef<View>(null);

  // Check if we were navigated here due to permission denial
  useEffect(() => {
    if (route.params?.permissionDenied) {
      setLocationPermission('denied');
    }
  }, [route.params?.permissionDenied]);

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
      // Use the updated permission check
      const permissionStatus = await checkPreciseLocationPermission();
      setLocationPermission(permissionStatus);

      if (permissionStatus === 'denied') {
        throw new Error(ERROR_MESSAGES.LOCATION_PERMISSION_DENIED);
      }

      const location = await getCurrentLocation();
      setUserLocation(location);
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

  // Add a function to prompt for precise location
  const promptForPreciseLocation = () => {
    Alert.alert(
      "Precise Location Needed",
      "For better accuracy, please enable precise location in your device settings.",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => {
            console.log("User canceled precise location permission prompt");
            // User explicitly declined to improve location precision
            // We continue with approximate location - no action needed
          }
        },
        {
          text: "Open Settings",
          onPress: () => {
            // Track that settings were opened for location permissions
            openLocationSettings();

            // Add listener for when app comes back to foreground
            const appStateSubscription = AppState.addEventListener('change', async (nextAppState: string) => {
              if (nextAppState === 'active') {
                // App has returned to foreground, check permission status again
                console.log("App returned to foreground, checking location permissions");
                // Remove the listener to avoid multiple checks
                appStateSubscription.remove();

                // Re-check precise location permission
                const newPermissionStatus = await checkPreciseLocationPermission();
                if (newPermissionStatus === 'limited') {
                  // User returned without upgrading to precise location
                  console.log("User returned from settings but still has limited location precision");
                  // Update state to ensure UI still shows the warning
                  setLocationPermission('limited');
                } else if (newPermissionStatus === 'granted') {
                  // User successfully upgraded to precise location
                  console.log("User upgraded to precise location");
                  setLocationPermission('granted');
                  // Refresh location with precise coordinates
                  getUserLocation();
                }
              }
            });
          }
        }
      ]
    );
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
              {/* Limited location precision warning for Android */}
              {locationPermission === 'limited' && Platform.OS === 'android' && (
                <TouchableOpacity
                  style={styles.warningBanner}
                  onPress={promptForPreciseLocation}
                >
                  <Ionicons name="warning-outline" size={18} color={COLORS.PRIMARY} />
                  <Text style={styles.warningText}>
                    {ERROR_MESSAGES.LOCATION_PRECISION_LIMITED}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.PRIMARY} />
                </TouchableOpacity>
              )}

              <View style={styles.inputContainer}>
                {locationPermission === 'denied' && (
                  <View style={styles.permissionMessageContainer}>
                    <Text style={styles.permissionTitle}>Location Access Required</Text>
                    <Text style={styles.permissionText}>
                      To use your current location, please enable location permissions for this app.
                    </Text>
                    <TouchableOpacity
                      style={[styles.button, styles.warningButton]}
                      onPress={openLocationSettings}
                    >
                      <Text style={styles.buttonText}>
                        Open Location Settings
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.permissionText}>
                      Alternatively, you can manually enter your location below.
                    </Text>
                  </View>
                )}

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
  const [appIsReady, setAppIsReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    async function prepare() {
      try {
        // Keep native splash screen visible while we prepare
        await SplashScreen.preventAutoHideAsync();

        // Set app as ready immediately without delay
        setAppIsReady(true);
      } catch (e) {
        console.warn(e);
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // Hide the native splash screen
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  // If app is not ready yet, return null to keep native splash
  if (!appIsReady) {
    return null;
  }

  return (
    <>
      <NavigationContainer onReady={onLayoutRootView}>
        <ErrorBoundary>
          <OfflineNotice />
          <Stack.Navigator>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ title: 'Whats Halfway' }}
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
              name="LocationPermission"
              component={LocationPermissionScreen}
              options={{
                title: 'Location Access',
                headerLeft: () => null, // This removes the back button
                gestureEnabled: false // This prevents iOS swipe back gesture
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
        </ErrorBoundary>
      </NavigationContainer>

      {/* Show animated splash with reduced duration */}
      {showSplash && (
        <AnimatedSplash
          message="Getting everything ready..."
          onAnimationFinish={handleSplashFinish}
          duration={1000}
        />
      )}
    </>
  );
}