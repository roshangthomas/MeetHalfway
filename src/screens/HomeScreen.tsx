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
import { LocationInput } from '../components/LocationInput';
import { TravelModePicker } from '../components/TravelModePicker';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { OfflineNotice } from '../components/OfflineNotice';
import {
    getCurrentLocation,
    getLastKnownLocation,
    calculateMidpoint,
    calculateRoadMidpoint,
    findOptimalMeetingPlaces,
    LocationPermissionStatus
} from '../services/location';
import { searchRestaurants, getTravelInfo } from '../services/places';
import { Location, Restaurant, TravelMode, PlaceCategory, RootStackParamList } from '../types';
import { styles } from '../styles/App.styles';
import { ERROR_MESSAGES, MAX_RESULTS } from '../constants';
import { CategoryPicker } from '../components/CategoryPicker';
import { LoadingOverlay } from '../components/LoadingOverlay';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ExpoLocation from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { useLocationPermission } from '../hooks/useLocationPermission';
import { formatAddressForDisplay, logger, resolveLocation, createRegionFromLocation } from '../utils';
import MapViewWrapper from '../components/MapViewWrapper';
import { Marker, Region } from 'react-native-maps';

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation, route }) => {
    const [partnerAddress, setPartnerAddress] = useState<string | null>(null);
    const [partnerPlaceId, setPartnerPlaceId] = useState<string | null>(null);
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
            setMapRegion(createRegionFromLocation(route.params.newLocation));
            navigation.setParams({ newLocation: undefined, newAddress: undefined });
        }
    }, [route.params?.newLocation, route.params?.newAddress, navigation]);

    useEffect(() => {
        if (userLocation && !mapRegion) {
            setMapRegion(createRegionFromLocation(userLocation));
        }
    }, [userLocation]);

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
                setMapRegion(createRegionFromLocation(cachedLocation));
                setLocationLoading(false);
                setError(null);

                getCurrentLocation(status, false).then((freshLocation) => {
                    setUserLocation(freshLocation);
                    setMapRegion(createRegionFromLocation(freshLocation));
                }).catch((err) => {
                    logger.warn('Background location refresh failed:', err);
                });
                return;
            }

            const location = await getCurrentLocation(status, false);
            setUserLocation(location);
            setMapRegion(createRegionFromLocation(location));
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
                partnerLoc = await resolveLocation(partnerAddress, partnerPlaceId);
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

            let optimizedRestaurants: Restaurant[] | undefined;
            try {
                optimizedRestaurants = await findOptimalMeetingPlaces(
                    userLocation,
                    partnerLoc,
                    travelMode,
                    selectedCategories,
                    MAX_RESULTS.RESTAURANTS
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
                allRestaurants = allRestaurants.slice(0, MAX_RESULTS.RESTAURANTS);

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
                        {locationLoading && !userLocation ? (
                            <View style={styles.mapLoadingContainer}>
                                <ActivityIndicator size="small" color={COLORS.PRIMARY} />
                            </View>
                        ) : mapRegion ? (
                            <View style={styles.mapContainer}>
                                <MapViewWrapper
                                    style={styles.map}
                                    region={mapRegion}
                                    scrollEnabled={false}
                                    zoomEnabled={false}
                                    rotateEnabled={false}
                                    pitchEnabled={false}
                                >
                                    {userLocation && (
                                        <Marker
                                            coordinate={{
                                                latitude: userLocation.latitude,
                                                longitude: userLocation.longitude,
                                            }}
                                            title="You"
                                        />
                                    )}
                                </MapViewWrapper>
                            </View>
                        ) : null}

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

                            <View style={styles.routeCard}>
                                {locationLoading && !userLocation && (
                                    <View style={styles.routeCardLoading}>
                                        <View style={styles.routeRow}>
                                            <View style={styles.routeDotContainer}>
                                                <View style={[styles.routeDot, styles.routeDotOrigin]} />
                                            </View>
                                            <View style={styles.routeInputArea}>
                                                <ActivityIndicator size="small" color={COLORS.PRIMARY} />
                                                <Text style={styles.routeLoadingText}>Detecting location...</Text>
                                            </View>
                                        </View>
                                        <View style={styles.routeConnector}>
                                            <View style={styles.routeDotSmall} />
                                            <View style={styles.routeDotSmall} />
                                            <View style={styles.routeDotSmall} />
                                        </View>
                                        <View style={styles.routeRow}>
                                            <View style={styles.routeDotContainer}>
                                                <View style={[styles.routeDot, styles.routeDotDestination]} />
                                            </View>
                                            <View style={[styles.routeInputPlaceholder, { backgroundColor: COLORS.GRAY_LIGHT }]} />
                                        </View>
                                    </View>
                                )}

                                {userLocation && (
                                    <>
                                        <View style={styles.routeRow}>
                                            <View style={styles.routeDotContainer}>
                                                <View style={[styles.routeDot, styles.routeDotOrigin]} />
                                            </View>
                                            <TouchableOpacity
                                                style={styles.routeLocationRow}
                                                onPress={handleChangeLocation}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={styles.routeLocationText} numberOfLines={1} ellipsizeMode="tail">
                                                    {formatAddressForDisplay(userAddress || "Current Location")}
                                                </Text>
                                                <Text style={styles.routeChangeText}>Change</Text>
                                            </TouchableOpacity>
                                        </View>

                                        <View style={styles.routeConnector}>
                                            <View style={styles.routeDotSmall} />
                                            <View style={styles.routeDotSmall} />
                                            <View style={styles.routeDotSmall} />
                                        </View>

                                        <View style={styles.routeRow}>
                                            <View style={styles.routeDotContainer}>
                                                <View style={[styles.routeDot, styles.routeDotDestination]} />
                                            </View>
                                            <View ref={partnerLocationInputRef} style={styles.routeInputArea}>
                                                <LocationInput
                                                    value={partnerAddress || ''}
                                                    onChangeText={(text) => {
                                                        setPartnerAddress(text);
                                                        setPartnerPlaceId(null);
                                                    }}
                                                    onPlaceSelected={(placeId, description) => {
                                                        setPartnerPlaceId(placeId);
                                                        setPartnerAddress(description);
                                                    }}
                                                    placeholder="Enter partner's location..."
                                                    onInputFocus={handlePartnerLocationFocus}
                                                    userLocation={userLocation}
                                                />
                                            </View>
                                        </View>
                                    </>
                                )}
                            </View>

                            {userLocation && (
                                <View style={styles.preferencesSection}>
                                    <TravelModePicker
                                        selectedMode={travelMode}
                                        onModeChange={setTravelMode}
                                    />

                                    <CategoryPicker
                                        selectedCategories={selectedCategories}
                                        onCategoriesChange={setSelectedCategories}
                                    />
                                </View>
                            )}

                            {userLocation && (
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
                                            Meet Halfway
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}

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
