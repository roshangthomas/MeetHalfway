import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import MapViewWrapper from './src/components/MapViewWrapper';
import { Marker } from 'react-native-maps';
import { LocationInput } from './src/components/LocationInput';
import { TravelModePicker } from './src/components/TravelModePicker';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { getCurrentLocation, geocodeAddress, calculateMidpoint } from './src/services/location';
import { Location, Restaurant, TravelMode, PlaceCategory, RootStackParamList } from './src/types';
import { styles } from './src/styles/App.styles';
import { ERROR_MESSAGES } from './src/constants';
import { CategoryPicker } from './src/components/CategoryPicker';
import { LoadingOverlay } from './src/components/LoadingOverlay';
import { mockPlaces } from './src/data/mockPlaces';
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

    setLoading(true);
    setError(null);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const partnerLoc = await geocodeAddress(partnerAddress);
      const midpoint = calculateMidpoint(userLocation, partnerLoc);

      // Update map region to show the midpoint
      setMapRegion({
        latitude: midpoint.latitude,
        longitude: midpoint.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });

      // Navigate to results screen with all necessary data
      navigation.navigate('Results', {
        restaurants: mockPlaces,
        userLocation,
        partnerLocation: partnerLoc,
        midpointLocation: midpoint,
      });

    } catch (error) {
      setError(ERROR_MESSAGES.RESTAURANT_SEARCH_FAILED);
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