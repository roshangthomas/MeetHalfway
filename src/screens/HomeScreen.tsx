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
    LayoutAnimation,
    UIManager,
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
} from '../services/location';
import { searchRestaurants, getTravelInfo } from '../services/places';
import { Location, Restaurant, TravelMode, PlaceCategory, Participant, RootStackParamList } from '../types';
import { styles } from '../styles/App.styles';
import { ERROR_MESSAGES, MAX_RESULTS, MAX_PARTICIPANTS, PARTICIPANT_COLORS } from '../constants';
import { CategoryPicker } from '../components/CategoryPicker';
import { LoadingOverlay } from '../components/LoadingOverlay';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ExpoLocation from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { useLocationPermission } from '../hooks/useLocationPermission';
import { formatAddressForDisplay, logger, resolveLocation, createRegionFromLocation, hapticMedium, hapticLight } from '../utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapViewWrapper from '../components/MapViewWrapper';
import { Marker, Region } from 'react-native-maps';

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

interface ParticipantEntry {
    address: string;
    placeId: string | null;
}

const STORAGE_KEYS = {
    TRAVEL_MODE: '@meethalfway/travelMode',
    CATEGORIES: '@meethalfway/categories',
} as const;

if (Platform.OS === 'android') {
    UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation, route }) => {
    const [participants, setParticipants] = useState<ParticipantEntry[]>([
        { address: '', placeId: null },
    ]);
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
    const preferencesLoaded = useRef(false);

    // Load saved preferences on mount
    useEffect(() => {
        const loadPreferences = async () => {
            try {
                const [savedMode, savedCategories] = await Promise.all([
                    AsyncStorage.getItem(STORAGE_KEYS.TRAVEL_MODE),
                    AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES),
                ]);
                const validTravelModes: TravelMode[] = ['driving', 'walking', 'transit', 'bicycling'];
                if (savedMode && validTravelModes.includes(savedMode as TravelMode)) {
                    setTravelMode(savedMode as TravelMode);
                }
                if (savedCategories) {
                    const parsed = JSON.parse(savedCategories) as PlaceCategory[];
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setSelectedCategories(parsed);
                    }
                }
            } catch (err) {
                logger.warn('Failed to load saved preferences:', err);
            } finally {
                preferencesLoaded.current = true;
            }
        };
        loadPreferences();
    }, []);

    // Persist travel mode when it changes
    useEffect(() => {
        if (!preferencesLoaded.current) return;
        AsyncStorage.setItem(STORAGE_KEYS.TRAVEL_MODE, travelMode).catch((err) => {
            logger.warn('Failed to save travel mode:', err);
        });
    }, [travelMode]);

    // Persist categories when they change
    useEffect(() => {
        if (!preferencesLoaded.current) return;
        AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(selectedCategories)).catch((err) => {
            logger.warn('Failed to save categories:', err);
        });
    }, [selectedCategories]);

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

    const updateParticipant = (index: number, updates: Partial<ParticipantEntry>) => {
        setParticipants(prev => {
            const next = [...prev];
            next[index] = { ...next[index], ...updates };
            return next;
        });
    };

    const addParticipant = () => {
        if (participants.length < MAX_PARTICIPANTS - 1) {
            hapticLight();
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setParticipants(prev => [...prev, { address: '', placeId: null }]);
        }
    };

    const removeParticipant = (index: number) => {
        hapticLight();
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setParticipants(prev => prev.filter((_, i) => i !== index));
    };

    const handleSearch = async () => {
        hapticMedium();
        if (!userLocation) {
            setError(ERROR_MESSAGES.USER_LOCATION_UNAVAILABLE);
            return;
        }

        const emptyParticipant = participants.find(p => !p.address.trim());
        if (emptyParticipant) {
            setError(ERROR_MESSAGES.PARTNER_LOCATION_INVALID);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const resolvedLocations: Location[] = [];
            for (const p of participants) {
                try {
                    const loc = await resolveLocation(p.address, p.placeId);
                    resolvedLocations.push(loc);
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

            const allLocations = [userLocation, ...resolvedLocations];

            const allParticipants: Participant[] = [
                { name: 'You', address: userAddress || 'Current Location', location: userLocation },
                ...participants.map((p, i) => ({
                    name: participants.length === 1 ? 'Them' : `Them ${i + 1}`,
                    address: p.address,
                    placeId: p.placeId,
                    location: resolvedLocations[i],
                })),
            ];

            let midpoint: Location;
            try {
                midpoint = await calculateRoadMidpoint(allLocations);
            } catch (midpointError) {
                logger.warn('Road midpoint calculation failed, falling back to simple midpoint', midpointError);
                midpoint = calculateMidpoint(allLocations);
            }

            let optimizedRestaurants: Restaurant[] | undefined;
            try {
                optimizedRestaurants = await findOptimalMeetingPlaces(
                    allLocations,
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
                        errorMessage: ERROR_MESSAGES.NO_PLACES_FOUND,
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
                    errorMessage: ERROR_MESSAGES.NO_PLACES_FOUND_GENERIC,
                });
                setLoading(false);
                return;
            }

            navigation.navigate('Results', {
                restaurants: optimizedRestaurants,
                participants: allParticipants,
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

    const handlePreciseLocationPrompt = () => {
        promptForPreciseLocation((location) => {
            setUserLocation(location);
        });
    };

    const allParticipantsHaveAddress = participants.every(p => p.address.trim().length > 0);

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
                                                <View style={[styles.routeDot, { backgroundColor: PARTICIPANT_COLORS[0] }]} />
                                            </View>
                                            <TouchableOpacity
                                                style={styles.routeLocationRow}
                                                onPress={handleChangeLocation}
                                                activeOpacity={0.7}
                                                accessibilityLabel="Your location"
                                                accessibilityRole="button"
                                                accessibilityHint="Tap to change your starting location"
                                            >
                                                <Text style={styles.routeLocationText} numberOfLines={1} ellipsizeMode="tail">
                                                    {formatAddressForDisplay(userAddress || "Current Location")}
                                                </Text>
                                                <Text style={styles.routeChangeText}>Change</Text>
                                            </TouchableOpacity>
                                        </View>

                                        {participants.map((participant, index) => (
                                            <React.Fragment key={index}>
                                                <View style={styles.routeConnector}>
                                                    <View style={styles.routeDotSmall} />
                                                    <View style={styles.routeDotSmall} />
                                                    <View style={styles.routeDotSmall} />
                                                </View>

                                                <View style={styles.routeRow}>
                                                    <View style={styles.routeDotContainer}>
                                                        <View style={[styles.routeDot, { backgroundColor: PARTICIPANT_COLORS[index + 1] || PARTICIPANT_COLORS[PARTICIPANT_COLORS.length - 1] }]} />
                                                    </View>
                                                    <View style={styles.participantInputGroup}>
                                                        <View style={styles.participantLocationInput}>
                                                            <LocationInput
                                                                value={participant.address}
                                                                onChangeText={(text) => {
                                                                    updateParticipant(index, { address: text, placeId: null });
                                                                }}
                                                                onPlaceSelected={(placeId, description) => {
                                                                    updateParticipant(index, { placeId, address: description });
                                                                }}
                                                                placeholder="Enter location..."
                                                                userLocation={userLocation}
                                                            />
                                                        </View>
                                                        {participants.length > 1 && (
                                                            <TouchableOpacity
                                                                style={styles.removeParticipantButton}
                                                                onPress={() => removeParticipant(index)}
                                                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                                                accessibilityLabel={`Remove participant ${index + 1}`}
                                                                accessibilityRole="button"
                                                                accessibilityHint="Removes this participant from the search"
                                                            >
                                                                <Ionicons name="close-circle" size={22} color={COLORS.GRAY} />
                                                            </TouchableOpacity>
                                                        )}
                                                    </View>
                                                </View>
                                            </React.Fragment>
                                        ))}

                                        {participants.length < MAX_PARTICIPANTS - 1 && (
                                            <TouchableOpacity
                                                style={styles.addParticipantButton}
                                                onPress={addParticipant}
                                                activeOpacity={0.7}
                                                accessibilityLabel="Add person"
                                                accessibilityRole="button"
                                                accessibilityHint="Adds another participant to the search"
                                            >
                                                <Ionicons name="add-circle-outline" size={20} color={COLORS.PRIMARY} />
                                                <Text style={styles.addParticipantText}>Add person</Text>
                                            </TouchableOpacity>
                                        )}
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
                                            (!allParticipantsHaveAddress || loading) && styles.buttonDisabled
                                        ]}
                                        onPress={handleSearch}
                                        disabled={loading || !allParticipantsHaveAddress}
                                        accessibilityLabel="Find meeting places"
                                        accessibilityHint="Searches for places between all participants"
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
