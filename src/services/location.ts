import * as Location from 'expo-location';
import axios from 'axios';
import { GOOGLE_MAPS_API_KEY } from '@env';
import { Location as LocationType } from '../types';
import { ERROR_MESSAGES } from '../constants/index';
import { PlaceCategory, Restaurant, TravelMode } from '../types';
import { Platform } from 'react-native';
import {
    GoogleGeocodingResponse,
    GoogleDirectionsResponse,
    GooglePlacesResponse,
    GooglePlaceResult,
    TravelInfo,
} from '../types/api';
import { parseDurationToMinutes } from '../utils/duration';
import { logger } from '../utils/logger';

interface AxiosErrorLike {
    isAxiosError: boolean;
    response?: { data?: unknown };
    request?: unknown;
}

const isAxiosError = (error: unknown): error is AxiosErrorLike => {
    return error !== null && typeof error === 'object' && 'isAxiosError' in error;
};

export type LocationPermissionStatus = 'granted' | 'denied' | 'limited' | 'pending';

interface AndroidForegroundPermission {
    android?: {
        accuracy?: 'fine' | 'coarse';
    };
}

export const checkPreciseLocationPermission = async (): Promise<LocationPermissionStatus> => {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
        return 'denied';
    }

    if (Platform.OS === 'android') {
        try {
            const permissions = await Location.getForegroundPermissionsAsync();
            const androidPermissions = permissions as unknown as AndroidForegroundPermission;
            const accuracy = androidPermissions.android?.accuracy;

            if (accuracy && accuracy !== 'fine') {
                return 'limited';
            }
        } catch (error) {
            logger.error('Error checking precise location permission:', error);
        }
    }

    return 'granted';
};

/**
 * Get the last known location instantly (cached by the OS).
 * Returns null if no cached location is available.
 */
export const getLastKnownLocation = async (): Promise<LocationType | null> => {
    try {
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown) {
            return {
                latitude: lastKnown.coords.latitude,
                longitude: lastKnown.coords.longitude,
            };
        }
        return null;
    } catch (error) {
        logger.warn('Could not get last known location:', error);
        return null;
    }
};

/**
 * Get the current GPS location.
 * @param preCheckedPermission - Optional pre-checked permission status to avoid duplicate checks
 * @param preferCached - If true, returns cached location first if available (faster cold start)
 */
export const getCurrentLocation = async (
    preCheckedPermission?: LocationPermissionStatus,
    preferCached: boolean = false
): Promise<LocationType> => {
    // Use pre-checked permission if provided, otherwise check it
    const permissionStatus = preCheckedPermission ?? await checkPreciseLocationPermission();

    if (permissionStatus === 'denied') {
        throw new Error(ERROR_MESSAGES.LOCATION_PERMISSION_DENIED);
    }

    try {
        // Try cached location first for faster cold start
        if (preferCached) {
            const cachedLocation = await getLastKnownLocation();
            if (cachedLocation) {
                logger.info('Using cached location for faster startup');
                return cachedLocation;
            }
        }

        let location;

        if (permissionStatus === 'limited' && Platform.OS === 'android') {
            location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Low
            });
            logger.warn(ERROR_MESSAGES.LOCATION_PRECISION_LIMITED);
        } else {
            location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced
            });
        }

        return {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
        };
    } catch (error) {
        logger.error('Error getting current location:', error);
        throw new Error(ERROR_MESSAGES.USER_LOCATION_UNAVAILABLE);
    }
};

export const geocodeAddress = async (address: string): Promise<LocationType> => {
    try {
        const response = await axios.get<GoogleGeocodingResponse>(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
                address
            )}&key=${GOOGLE_MAPS_API_KEY}`
        );

        if (response.data.status === 'ZERO_RESULTS') {
            throw new Error(ERROR_MESSAGES.PARTNER_LOCATION_INVALID);
        }

        if (response.data.status === 'REQUEST_DENIED') {
            throw new Error(ERROR_MESSAGES.API_KEY_INVALID);
        }

        if (response.data.status === 'OVER_QUERY_LIMIT') {
            throw new Error(ERROR_MESSAGES.API_QUOTA_EXCEEDED);
        }

        if (response.data.status !== 'OK' || response.data.results.length === 0) {
            throw new Error(ERROR_MESSAGES.GEOCODING_FAILED);
        }

        const { lat, lng } = response.data.results[0].geometry.location;
        return { latitude: lat, longitude: lng };
    } catch (error: unknown) {
        logger.error('Geocoding error:', error);

        if (isAxiosError(error)) {
            if (!error.response && error.request) {
                throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
            }
        }

        if (error instanceof Error &&
            [
                ERROR_MESSAGES.PARTNER_LOCATION_INVALID,
                ERROR_MESSAGES.API_KEY_INVALID,
                ERROR_MESSAGES.API_QUOTA_EXCEEDED,
                ERROR_MESSAGES.GEOCODING_FAILED
            ].includes(error.message)) {
            throw error;
        }

        throw new Error(ERROR_MESSAGES.GEOCODING_FAILED);
    }
};

export const calculateMidpoint = (locationA: LocationType, locationB: LocationType): LocationType => {
    return {
        latitude: (locationA.latitude + locationB.latitude) / 2,
        longitude: (locationA.longitude + locationB.longitude) / 2,
    };
};

export const calculateRoadMidpoint = async (
    locationA: LocationType,
    locationB: LocationType
): Promise<LocationType> => {
    try {
        const response = await axios.get<GoogleDirectionsResponse>(
            `https://maps.googleapis.com/maps/api/directions/json?origin=${locationA.latitude},${locationA.longitude}&destination=${locationB.latitude},${locationB.longitude}&key=${GOOGLE_MAPS_API_KEY}`
        );

        if (!response.data.routes || response.data.routes.length === 0) {
            logger.error('No route found between locations');
            throw new Error(ERROR_MESSAGES.ROUTE_NOT_FOUND);
        }

        const route = response.data.routes[0];
        const legs = route.legs[0];
        const steps = legs.steps;

        const totalDistance = legs.distance.value;
        const halfDistance = totalDistance / 2;

        let distanceCovered = 0;
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            const stepDistance = step.distance.value;

            if (distanceCovered + stepDistance >= halfDistance) {
                const remainingDistance = halfDistance - distanceCovered;
                const ratio = remainingDistance / stepDistance;

                const startLat = step.start_location.lat;
                const startLng = step.start_location.lng;
                const endLat = step.end_location.lat;
                const endLng = step.end_location.lng;

                return {
                    latitude: startLat + (endLat - startLat) * ratio,
                    longitude: startLng + (endLng - startLng) * ratio
                };
            }

            distanceCovered += stepDistance;
        }

        logger.warn('Could not find exact road midpoint, falling back to simple midpoint');
        return calculateMidpoint(locationA, locationB);
    } catch (error) {
        logger.error('Error calculating road midpoint:', error);
        return calculateMidpoint(locationA, locationB);
    }
};

const getTravelInfo = async (
    origin: LocationType,
    destination: LocationType,
    mode: TravelMode
): Promise<TravelInfo> => {
    try {
        const response = await axios.get<GoogleDirectionsResponse>(
            `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&mode=${mode}&key=${GOOGLE_MAPS_API_KEY}`
        );

        if (!response.data.routes || response.data.routes.length === 0) {
            return { distance: 'Unknown', duration: 'Unknown' };
        }

        const route = response.data.routes[0].legs[0];
        return {
            distance: route.distance.text,
            duration: route.duration.text,
        };
    } catch (error) {
        logger.error('Error getting travel info:', error);
        return { distance: 'Unknown', duration: 'Unknown' };
    }
};

const searchNearbyVenues = async (
    location: LocationType,
    radius: number,
    types: string
): Promise<GooglePlaceResult[]> => {
    try {
        const response = await axios.get<GooglePlacesResponse>(
            `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
            `location=${location.latitude},${location.longitude}` +
            `&radius=${radius}` +
            `&type=${types}` +
            `&key=${GOOGLE_MAPS_API_KEY}`
        );

        if (response.data.status !== 'OK' || !response.data.results) {
            return [];
        }

        return response.data.results;
    } catch (error) {
        logger.error('Error searching for nearby venues:', error);
        return [];
    }
};

export const findOptimalMeetingPlaces = async (
    locationA: LocationType,
    locationB: LocationType,
    travelMode: TravelMode,
    categories: PlaceCategory[],
    maxResults: number = 20
): Promise<Restaurant[]> => {
    try {
        let midpoint: LocationType;
        try {
            midpoint = await findPracticalMidpoint(locationA, locationB, travelMode);
        } catch (error) {
            logger.warn('Practical midpoint calculation failed, falling back to simple midpoint', error);
            midpoint = calculateMidpoint(locationA, locationB);
        }

        let allVenues: Restaurant[] = [];

        for (const category of categories) {
            try {
                const response = await axios.get<GooglePlacesResponse>(
                    `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${midpoint.latitude},${midpoint.longitude}&radius=1500&type=${category}&key=${GOOGLE_MAPS_API_KEY}`
                );

                if (!response.data.results || response.data.results.length === 0) {
                    continue;
                }

                const venues: Restaurant[] = response.data.results.map((place) => ({
                    id: place.place_id,
                    name: place.name,
                    rating: place.rating || 0,
                    address: place.vicinity || 'Address not available',
                    latitude: place.geometry.location.lat,
                    longitude: place.geometry.location.lng,
                    photoUrl: place.photos?.[0]
                        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_MAPS_API_KEY}`
                        : undefined,
                    totalRatings: place.user_ratings_total || 0,
                    priceLevel: place.price_level || 0,
                    types: place.types || [],
                }));

                allVenues = [...allVenues, ...venues];
            } catch (error) {
                logger.error(`Error searching for ${category}:`, error);
            }
        }

        allVenues = allVenues.filter((venue, index, self) =>
            index === self.findIndex((v) => v.id === venue.id)
        );

        if (allVenues.length === 0) {
            throw new Error('No venues found near the midpoint');
        }

        const venuesWithTravelInfo = await Promise.all(
            allVenues.map(async (venue) => {
                try {
                    const venueLocation: LocationType = {
                        latitude: venue.latitude,
                        longitude: venue.longitude
                    };

                    const travelInfoA = await getTravelInfo(locationA, venueLocation, travelMode);
                    const travelInfoB = await getTravelInfo(locationB, venueLocation, travelMode);

                    const travelTimeA = parseDurationToMinutes(travelInfoA.duration);
                    const travelTimeB = parseDurationToMinutes(travelInfoB.duration);

                    const timeDifference = Math.abs(travelTimeA - travelTimeB);

                    const fairnessScore = 100 - Math.min(timeDifference, 100);
                    const ratingScore = (venue.rating || 3) * 20;
                    const totalTimeScore = 100 - Math.min((travelTimeA + travelTimeB) / 2, 100);

                    const score = (fairnessScore * 0.5) + (ratingScore * 0.3) + (totalTimeScore * 0.2);

                    return {
                        ...venue,
                        travelTimeA,
                        travelTimeB,
                        timeDifference,
                        totalTravelTime: travelTimeA + travelTimeB,
                        fairnessScore,
                        score,
                        distanceA: travelInfoA.distance,
                        durationA: travelInfoA.duration,
                        distanceB: travelInfoB.distance,
                        durationB: travelInfoB.duration,
                        distance: travelInfoA.distance,
                        duration: travelInfoA.duration,
                    };
                } catch (error) {
                    logger.error(`Error calculating travel info for ${venue.name}:`, error);
                    return {
                        ...venue,
                        travelTimeA: 9999,
                        travelTimeB: 9999,
                        timeDifference: 9999,
                        totalTravelTime: 9999,
                        fairnessScore: 0,
                        score: 0,
                        distanceA: 'Unknown',
                        durationA: 'Unknown',
                        distanceB: 'Unknown',
                        durationB: 'Unknown',
                        distance: 'Unknown',
                        duration: 'Unknown',
                    };
                }
            })
        );

        venuesWithTravelInfo.sort((a, b) => b.score - a.score);

        return venuesWithTravelInfo.slice(0, maxResults);
    } catch (error) {
        logger.error('Error finding optimal meeting places:', error);
        throw error;
    }
};

export const findPracticalMidpoint = async (
    locationA: LocationType,
    locationB: LocationType,
    travelMode: TravelMode = 'driving'
): Promise<LocationType> => {
    try {
        let roadMidpoint: LocationType;
        try {
            roadMidpoint = await calculateRoadMidpoint(locationA, locationB);
        } catch (error) {
            logger.warn('Road midpoint calculation failed, falling back to simple midpoint', error);
            roadMidpoint = calculateMidpoint(locationA, locationB);
        }

        const venueTypes = [
            'restaurant', 'cafe', 'bar', 'shopping_mall', 'department_store',
            'supermarket', 'bakery', 'library', 'park', 'book_store'
        ].join('|');

        let venues: GooglePlaceResult[] = [];
        const searchRadii = [500, 1500, 3000, 5000, 10000, 15000, 20000, 25000, 30000, 35000, 40000, 45000, 50000];

        for (const radius of searchRadii) {
            venues = await searchNearbyVenues(roadMidpoint, radius, venueTypes);
            if (venues.length > 0) {
                break;
            }
        }

        if (venues.length === 0) {
            return roadMidpoint;
        }

        const scoredVenues = await Promise.all(
            venues.map(async (venue) => {
                const venueLocation: LocationType = {
                    latitude: venue.geometry.location.lat,
                    longitude: venue.geometry.location.lng
                };

                const travelInfoA = await getTravelInfo(locationA, venueLocation, travelMode);
                const travelInfoB = await getTravelInfo(locationB, venueLocation, travelMode);

                const travelTimeA = parseDurationToMinutes(travelInfoA.duration);
                const travelTimeB = parseDurationToMinutes(travelInfoB.duration);

                const timeDifference = Math.abs(travelTimeA - travelTimeB);
                const totalTravelTime = travelTimeA + travelTimeB;

                const rating = venue.rating || 3;
                const userRatingsTotal = venue.user_ratings_total || 0;

                const isOnMajorRoad = venue.types?.some((type: string) =>
                    ['route', 'street_address', 'point_of_interest'].includes(type)
                ) || false;

                const fairnessScore = 100 - Math.min(timeDifference, 100);
                const travelTimeScore = 100 - Math.min(totalTravelTime / 2, 100);
                const qualityScore = Math.min((rating * 20) * (Math.min(userRatingsTotal, 100) / 100), 100);
                const accessibilityScore = isOnMajorRoad ? 100 : 50;

                const totalScore = (
                    (fairnessScore * 0.35) +
                    (travelTimeScore * 0.30) +
                    (qualityScore * 0.25) +
                    (accessibilityScore * 0.10)
                );

                return {
                    location: venueLocation,
                    name: venue.name,
                    score: totalScore,
                };
            })
        );

        scoredVenues.sort((a, b) => b.score - a.score);

        return scoredVenues.length > 0 ? scoredVenues[0].location : roadMidpoint;
    } catch (error) {
        logger.error('Error finding practical midpoint:', error);
        return calculateMidpoint(locationA, locationB);
    }
};
