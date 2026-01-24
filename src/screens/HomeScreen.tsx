import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Platform,
    KeyboardAvoidingView,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import MapViewWrapper from '../components/MapViewWrapper';
import { Marker, Region } from 'react-native-maps';
import { LocationInput } from '../components/LocationInput';
import { TravelModePicker } from '../components/TravelModePicker';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { OfflineNotice } from '../components/OfflineNotice';
import {
    getCurrentLocation,
    getLastKnownLocation,
    geocodeAddress,
    calculateMidpoint,
    calculateRoadMidpoint,
    findOptimalMeetingPlaces,
    LocationPermissionStatus
} from '../services/location';
import { searchRestaurants, getTravelInfo } from '../services/places';
import { Location, Restaurant, TravelMode, PlaceCategory, RootStackParamList } from '../types';
import { styles } from '../styles/App.styles';
import { ERROR_MESSAGES } from '../constants';
import { CategoryPicker } from '../components/CategoryPicker';
import { LoadingOverlay } from '../components/LoadingOverlay';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ExpoLocation from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, MAP_DELTAS } from '../constants';
import { useLocationPermission } from '../hooks/useLocationPermission';
import { formatAddressForDisplay, logger } from '../utils';

const { height } = Dimensions.get('window');

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation, route }) => {
    const [partnerAddress, setPartnerAddress] = useState<string | null>(null);
    const [userAddress, setUserAddress] = useState<string | null>(null);
    const [userLocation, setUserLocation] = useState<Location | null>(null);
    const [loading, setLoading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [travelMode, setTravelMode] = useState<TravelMode>('driving');
    const [selectedCategories, setSelectedCategories] = useState<PlaceCategory[]>(['restaurant']);
    const [mapRegion, setMapRegion] = useState<Region | null>(null);

    const {
        permissionStatus,
        setPermissionStatus,
        checkPermission,
        promptForPreciseLocation,
    } = useLocationPermission();

    const scrollViewRef = useRef<ScrollView>(null);
    const partnerLocationInputRef = useRef<View>(null);

    useEffect(() => {
        if (route.params?.newLocation && route.params?.newAddress) {
            setUserLocation(route.params.newLocation);
            setUserAddress(route.params.newAddress);
            setMapRegion({
                latitude: route.params.newLocation.latitude,
                longitude: route.params.newLocation.longitude,
                latitudeDelta: MAP_DELTAS.LATITUDE,
                longitudeDelta: MAP_DELTAS.LONGITUDE,
            });

            navigation.setParams({ newLocation: undefined, newAddress: undefined });
        }
    }, [route.params?.newLocation, route.params?.newAddress, navigation]);

    useEffect(() => {
        if (userLocation && !mapRegion) {
            setMapRegion({
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                latitudeDelta: MAP_DELTAS.LATITUDE,
                longitudeDelta: MAP_DELTAS.LONGITUDE,
            });
        }
    }, [userLocation, mapRegion]);

    useEffect(() => {
        const checkLocationServices = async () => {
            if ((route.params?.newLocation && route.params?.newAddress) || userAddress) {
                setLocationLoading(false);
                return;
            }

            const enabled = await ExpoLocation.hasServicesEnabledAsync();

            if (!enabled) {
                setPermissionStatus('denied');
                setLocationLoading(false);
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'LocationPermission' }],
                });
            } else {
                getUserLocation();
            }
        };

        checkLocationServices();
    }, [navigation, route.params?.newLocation, route.params?.newAddress, userAddress]);

    const getUserLocation = async () => {
        if (userAddress) {
            setLocationLoading(false);
            return;
        }

        setLocationLoading(true);
        try {
            // Check permission once
            const status = await checkPermission();

            if (status === 'denied') {
                setLocationLoading(false);
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'LocationPermission' }],
                });
                throw new Error(ERROR_MESSAGES.LOCATION_PERMISSION_DENIED);
            }

            const cachedLocation = await getLastKnownLocation();
            if (cachedLocation) {
                setUserLocation(cachedLocation);
                setMapRegion({
                    latitude: cachedLocation.latitude,
                    longitude: cachedLocation.longitude,
                    latitudeDelta: MAP_DELTAS.LATITUDE,
                    longitudeDelta: MAP_DELTAS.LONGITUDE,
                });
                setLocationLoading(false);
                setError(null);

                getCurrentLocation(status, false).then((freshLocation) => {
                    setUserLocation(freshLocation);
                    setMapRegion({
                        latitude: freshLocation.latitude,
                        longitude: freshLocation.longitude,
                        latitudeDelta: MAP_DELTAS.LATITUDE,
                        longitudeDelta: MAP_DELTAS.LONGITUDE,
                    });
                }).catch((err) => {
                    logger.warn('Background location refresh failed:', err);
                });
                return;
            }

            const location = await getCurrentLocation(status, false);
            setUserLocation(location);
            setMapRegion({
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: MAP_DELTAS.LATITUDE,
                longitudeDelta: MAP_DELTAS.LONGITUDE,
            });
            setError(null);
        } catch (err) {
            logger.error('Failed to get user location:', err);
            if (err instanceof Error && err.message === ERROR_MESSAGES.LOCATION_PERMISSION_DENIED) {
                setPermissionStatus('denied');
                if (!userAddress) {
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'LocationPermission' }],
                    });
                    setError(err.message);
                }
            } else {
                setError(err instanceof Error ? err.message : ERROR_MESSAGES.USER_LOCATION_UNAVAILABLE);
            }
        } finally {
            setLocationLoading(false);
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
            let partnerLoc: Location;
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

            let midpoint: Location;
            try {
                midpoint = await calculateRoadMidpoint(userLocation, partnerLoc);
            } catch (midpointError) {
                logger.warn('Road midpoint calculation failed, falling back to simple midpoint', midpointError);
                midpoint = calculateMidpoint(userLocation, partnerLoc);
            }

            setMapRegion({
                latitude: midpoint.latitude,
                longitude: midpoint.longitude,
                latitudeDelta: MAP_DELTAS.LATITUDE,
                longitudeDelta: MAP_DELTAS.LONGITUDE,
            });

            let optimizedRestaurants: Restaurant[] | undefined;
            try {
                optimizedRestaurants = await findOptimalMeetingPlaces(
                    userLocation,
                    partnerLoc,
                    travelMode,
                    selectedCategories,
                    20
                );
            } catch (searchError) {
                logger.warn('Optimized venue search failed, falling back to simple search', searchError);
                let allRestaurants: Restaurant[] = [];

                try {
                    for (const category of selectedCategories) {
                        const categoryRestaurants = await searchRestaurants(midpoint, category);
                        allRestaurants = [...allRestaurants, ...categoryRestaurants];
                    }
                } catch (err) {
                    if (err instanceof Error) {
                        setError(err.message);
                    } else {
                        setError(ERROR_MESSAGES.RESTAURANT_SEARCH_FAILED);
                    }
                    setLoading(false);
                    return;
                }

                if (allRestaurants.length === 0) {
                    navigation.navigate('NoResults', {
                        errorMessage: `No places found near the midpoint. Try different categories or locations.`
                    });
                    setLoading(false);
                    return;
                }

                allRestaurants = allRestaurants.filter((restaurant, index, self) =>
                    index === self.findIndex((r) => r.id === restaurant.id)
                );

                allRestaurants.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                allRestaurants = allRestaurants.slice(0, 20);

                const travelPromises = allRestaurants.map(async (restaurant) => {
                    try {
                        const restaurantLocation: Location = {
                            latitude: restaurant.latitude,
                            longitude: restaurant.longitude
                        };
                        const travelInfo = await getTravelInfo(userLocation, restaurantLocation, travelMode);
                        restaurant.distance = travelInfo.distance;
                        restaurant.duration = travelInfo.duration;
                        return restaurant;
                    } catch {
                        restaurant.distance = 'Unknown';
                        restaurant.duration = 'Unknown';
                        return restaurant;
                    }
                });

                optimizedRestaurants = await Promise.all(travelPromises);
            }

            if (!optimizedRestaurants || optimizedRestaurants.length === 0) {
                navigation.navigate('NoResults', {
                    errorMessage: `No places found. Try different categories or locations.`
                });
                setLoading(false);
                return;
            }

            navigation.navigate('Results', {
                restaurants: optimizedRestaurants,
                userLocation: userLocation,
                partnerLocation: partnerLoc,
                midpointLocation: midpoint,
                travelMode: travelMode,
            });

        } catch (err) {
            logger.error('Search error:', err);
            const errorMessage = err instanceof Error ? err.message : ERROR_MESSAGES.RESTAURANT_SEARCH_FAILED;
            navigation.navigate('NoResults', { errorMessage });
        } finally {
            setLoading(false);
        }
    };

    const handlePartnerLocationFocus = () => {
        setTimeout(() => {
            if (partnerLocationInputRef.current && scrollViewRef.current) {
                partnerLocationInputRef.current.measureInWindow((x, y, width, height) => {
                    const yOffset = y + 150;
                    scrollViewRef.current?.scrollTo({ y: yOffset, animated: true });
                });
            }
        }, 300);
    };

    const handlePreciseLocationPrompt = () => {
        promptForPreciseLocation((location) => {
            setUserLocation(location);
            setMapRegion({
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: MAP_DELTAS.LATITUDE,
                longitudeDelta: MAP_DELTAS.LONGITUDE,
            });
        });
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
                            {permissionStatus === 'limited' && Platform.OS === 'android' && (
                                <TouchableOpacity
                                    style={styles.warningBanner}
                                    onPress={handlePreciseLocationPrompt}
                                >
                                    <Ionicons name="warning-outline" size={18} color={COLORS.PRIMARY} />
                                    <Text style={styles.warningText}>
                                        {ERROR_MESSAGES.LOCATION_PRECISION_LIMITED}
                                    </Text>
                                    <Ionicons name="chevron-forward" size={16} color={COLORS.PRIMARY} />
                                </TouchableOpacity>
                            )}

                            {locationLoading && !userLocation && (
                                <View style={[styles.mapContainer, { backgroundColor: COLORS.GRAY_LIGHT, justifyContent: 'center', alignItems: 'center' }]}>
                                    <ActivityIndicator size="large" color={COLORS.PRIMARY} />
                                    <Text style={{ marginTop: 8, color: COLORS.GRAY, fontSize: 14 }}>
                                        Getting your location...
                                    </Text>
                                </View>
                            )}

                            {userLocation && (
                                <View style={styles.mapContainer}>
                                    <MapViewWrapper
                                        style={styles.map}
                                        region={mapRegion || {
                                            latitude: userLocation.latitude,
                                            longitude: userLocation.longitude,
                                            latitudeDelta: MAP_DELTAS.LATITUDE,
                                            longitudeDelta: MAP_DELTAS.LONGITUDE,
                                        }}
                                        initialRegion={{
                                            latitude: userLocation.latitude,
                                            longitude: userLocation.longitude,
                                            latitudeDelta: MAP_DELTAS.LATITUDE,
                                            longitudeDelta: MAP_DELTAS.LONGITUDE,
                                        }}
                                    >
                                        <Marker
                                            coordinate={{
                                                latitude: userLocation.latitude,
                                                longitude: userLocation.longitude,
                                            }}
                                            title="Your Location"
                                        />
                                    </MapViewWrapper>
                                </View>
                            )}

                            <View style={styles.inputContainer}>
                                {locationLoading && !userLocation && (
                                    <View style={{ opacity: 0.5 }}>
                                        <Text style={styles.label}>Your Location:</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                                            <ActivityIndicator size="small" color={COLORS.PRIMARY} />
                                            <Text style={{ marginLeft: 8, color: COLORS.GRAY }}>Detecting location...</Text>
                                        </View>
                                        <Text style={styles.label}>Partner's Location:</Text>
                                        <View style={{ height: 48, backgroundColor: COLORS.GRAY_LIGHT, borderRadius: 8, marginBottom: 12 }} />
                                    </View>
                                )}

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
                                                accessibilityLabel="Find meeting places"
                                                accessibilityHint="Searches for places between your location and your partner's location"
                                                accessibilityRole="button"
                                            >
                                                <Text style={styles.findButtonText}>
                                                    Find Meeting Point & Places
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </>
                                )}
                            </View>

                            {(error || permissionStatus === 'denied') && (
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
};

