import * as Location from 'expo-location';
import { Location as LocationType, PlaceCategory, Restaurant, TravelMode } from '../types';
import { ERROR_MESSAGES, SEARCH_RADIUS, MAX_RESULTS } from '../constants';
import { Platform } from 'react-native';
import {
    GoogleGeocodingResponse,
    GoogleDirectionsResponse,
    GooglePlacesResponse,
    GooglePlaceResult,
} from '../types/api';
import { logger, isKnownErrorMessage, buildPhotoUrl } from '../utils';
import { googleMapsClient, ENDPOINTS, CACHE_TTL } from '../api/client';
import {
    getBatchTravelInfo,
    VenueLocation,
    BatchTravelResult,
} from './distanceMatrix';

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

export const getCurrentLocation = async (
    preCheckedPermission?: LocationPermissionStatus,
    preferCached: boolean = false
): Promise<LocationType> => {
    const permissionStatus = preCheckedPermission ?? await checkPreciseLocationPermission();

    if (permissionStatus === 'denied') {
        throw new Error(ERROR_MESSAGES.LOCATION_PERMISSION_DENIED);
    }

    try {
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
        const response = await googleMapsClient.get<GoogleGeocodingResponse>(
            ENDPOINTS.geocode,
            { address },
            { cacheTTL: CACHE_TTL.GEOCODE }
        );

        if (response.status === 'ZERO_RESULTS') {
            throw new Error(ERROR_MESSAGES.PARTNER_LOCATION_INVALID);
        }

        if (response.status === 'REQUEST_DENIED') {
            throw new Error(ERROR_MESSAGES.API_KEY_INVALID);
        }

        if (response.status === 'OVER_QUERY_LIMIT') {
            throw new Error(ERROR_MESSAGES.API_QUOTA_EXCEEDED);
        }

        if (response.status !== 'OK' || response.results.length === 0) {
            throw new Error(ERROR_MESSAGES.GEOCODING_FAILED);
        }

        const { lat, lng } = response.results[0].geometry.location;
        return { latitude: lat, longitude: lng };
    } catch (error: unknown) {
        logger.error('Geocoding error:', error);

        if (error instanceof Error && isKnownErrorMessage(error.message)) {
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
        const response = await googleMapsClient.get<GoogleDirectionsResponse>(
            ENDPOINTS.directions,
            {
                origin: `${locationA.latitude},${locationA.longitude}`,
                destination: `${locationB.latitude},${locationB.longitude}`,
            },
            { cacheTTL: CACHE_TTL.DIRECTIONS }
        );

        if (!response.routes || response.routes.length === 0) {
            logger.error('No route found between locations');
            throw new Error(ERROR_MESSAGES.ROUTE_NOT_FOUND);
        }

        const route = response.routes[0];
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

const searchNearbyVenues = async (
    location: LocationType,
    radius: number,
    types: string
): Promise<GooglePlaceResult[]> => {
    try {
        const response = await googleMapsClient.get<GooglePlacesResponse>(
            ENDPOINTS.placesNearby,
            {
                location: `${location.latitude},${location.longitude}`,
                radius,
                type: types,
            },
            { cacheTTL: CACHE_TTL.PLACES_NEARBY }
        );

        if (response.status !== 'OK' || !response.results) {
            return [];
        }

        return response.results;
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
                const response = await googleMapsClient.get<GooglePlacesResponse>(
                    ENDPOINTS.placesNearby,
                    {
                        location: `${midpoint.latitude},${midpoint.longitude}`,
                        radius: SEARCH_RADIUS.DEFAULT,
                        type: category,
                    },
                    { cacheTTL: CACHE_TTL.PLACES_NEARBY }
                );

                if (!response.results || response.results.length === 0) {
                    continue;
                }

                const venues: Restaurant[] = response.results.map((place) => ({
                    id: place.place_id,
                    name: place.name,
                    rating: place.rating || 0,
                    address: place.vicinity || 'Address not available',
                    latitude: place.geometry.location.lat,
                    longitude: place.geometry.location.lng,
                    photoUrl: place.photos?.[0]
                        ? buildPhotoUrl(place.photos[0].photo_reference)
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

        const venueLocations: VenueLocation[] = allVenues.map((venue) => ({
            id: venue.id,
            latitude: venue.latitude,
            longitude: venue.longitude,
        }));

        logger.info(`Fetching batch travel info for ${venueLocations.length} venues`);
        const travelResults = await getBatchTravelInfo(
            locationA,
            locationB,
            venueLocations,
            travelMode
        );

        const travelMap = new Map<string, BatchTravelResult>();
        travelResults.forEach((result) => {
            travelMap.set(result.venueId, result);
        });

        const venuesWithTravelInfo = allVenues.map((venue) => {
            const travel = travelMap.get(venue.id);

            if (!travel) {
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

            const timeDifference = Math.abs(travel.travelTimeA - travel.travelTimeB);
            const fairnessScore = 100 - Math.min(timeDifference, 100);
            const ratingScore = (venue.rating || 3) * 20;
            const totalTimeScore = 100 - Math.min((travel.travelTimeA + travel.travelTimeB) / 2, 100);

            const score = (fairnessScore * 0.5) + (ratingScore * 0.3) + (totalTimeScore * 0.2);

            return {
                ...venue,
                travelTimeA: travel.travelTimeA,
                travelTimeB: travel.travelTimeB,
                timeDifference,
                totalTravelTime: travel.travelTimeA + travel.travelTimeB,
                fairnessScore,
                score,
                distanceA: travel.distanceA,
                durationA: travel.durationA,
                distanceB: travel.distanceB,
                durationB: travel.durationB,
                distance: travel.distanceA,
                duration: travel.durationA,
            };
        });

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
        const searchRadii = SEARCH_RADIUS.EXPANDED;

        for (const radius of searchRadii) {
            venues = await searchNearbyVenues(roadMidpoint, radius, venueTypes);
            if (venues.length > 0) {
                break;
            }
        }

        if (venues.length === 0) {
            return roadMidpoint;
        }

        const limitedVenues = venues.slice(0, MAX_RESULTS.VENUES_FOR_MIDPOINT);

        const venueLocations: VenueLocation[] = limitedVenues.map((venue) => ({
            id: venue.place_id,
            latitude: venue.geometry.location.lat,
            longitude: venue.geometry.location.lng,
        }));

        const travelResults = await getBatchTravelInfo(
            locationA,
            locationB,
            venueLocations,
            travelMode
        );

        const scoredVenues = limitedVenues.map((venue, index) => {
            const travel = travelResults[index];
            const venueLocation: LocationType = {
                latitude: venue.geometry.location.lat,
                longitude: venue.geometry.location.lng,
            };

            const timeDifference = Math.abs(travel.travelTimeA - travel.travelTimeB);
            const totalTravelTime = travel.travelTimeA + travel.travelTimeB;

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
        });

        scoredVenues.sort((a, b) => b.score - a.score);

        return scoredVenues.length > 0 ? scoredVenues[0].location : roadMidpoint;
    } catch (error) {
        logger.error('Error finding practical midpoint:', error);
        return calculateMidpoint(locationA, locationB);
    }
};
