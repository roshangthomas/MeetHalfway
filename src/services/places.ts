import { Location, Restaurant, TravelMode, PlaceCategory } from '../types';
import {
    GooglePlacesResponse,
    GoogleDirectionsResponse,
    GooglePlacesAutocompleteResponse,
    GooglePlaceDetailsResponse,
    GooglePlaceDetailsGeoResponse,
    PlacePrediction,
    TravelInfo,
} from '../types/api';
import { logger, buildPhotoUrl } from '../utils';
import { SEARCH_RADIUS } from '../constants';
import { googleMapsClient, ENDPOINTS, CACHE_TTL } from '../api/client';

// Lightweight fetch for editorial summary only (cached alongside other details)
const fetchEditorialSummary = async (placeId: string): Promise<string | undefined> => {
    try {
        const response = await googleMapsClient.get<GooglePlaceDetailsResponse>(
            ENDPOINTS.placeDetails,
            {
                place_id: placeId,
                fields: 'editorial_summary',
            },
            { cacheTTL: CACHE_TTL.PLACE_DETAILS }
        );
        return response.result?.editorial_summary?.overview;
    } catch {
        return undefined;
    }
};

export const searchRestaurants = async (
    location: Location,
    category: PlaceCategory
): Promise<Restaurant[]> => {
    try {
        const response = await googleMapsClient.get<GooglePlacesResponse>(
            ENDPOINTS.placesNearby,
            {
                location: `${location.latitude},${location.longitude}`,
                radius: SEARCH_RADIUS.DEFAULT,
                type: category,
            },
            { cacheTTL: CACHE_TTL.PLACES_NEARBY }
        );

        if (!response.results || response.results.length === 0) {
            return [];
        }

        const restaurants = response.results.map((place) => ({
            id: place.place_id,
            name: place.name,
            rating: place.rating || 0,
            address: place.vicinity || 'Address not available',
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
            photoUrl: place.photos?.[0]
                ? buildPhotoUrl(place.photos[0].photo_reference)
                : undefined,
            photoUrls: place.photos
                ? place.photos.slice(0, 5).map(p => buildPhotoUrl(p.photo_reference))
                : undefined,
            totalRatings: place.user_ratings_total || 0,
            priceLevel: place.price_level || 0,
            types: place.types || [],
        }));

        // Batch-fetch editorial summaries in parallel (lightweight, cached)
        const summaries = await Promise.all(
            restaurants.map(r => fetchEditorialSummary(r.id))
        );

        return restaurants.map((r, i) => ({
            ...r,
            editorialSummary: summaries[i],
        }));
    } catch (error: unknown) {
        logger.error('Error searching for places:', error);
        throw new Error('Failed to search places');
    }
};

export const getTravelInfo = async (
    origin: Location,
    destination: Location,
    mode: TravelMode
): Promise<TravelInfo> => {
    try {
        const response = await googleMapsClient.get<GoogleDirectionsResponse>(
            ENDPOINTS.directions,
            {
                origin: `${origin.latitude},${origin.longitude}`,
                destination: `${destination.latitude},${destination.longitude}`,
                mode,
            },
            { cacheTTL: CACHE_TTL.DIRECTIONS }
        );

        if (!response.routes || response.routes.length === 0) {
            return {
                distance: 'Unknown',
                duration: 'Unknown'
            };
        }

        const route = response.routes[0].legs[0];
        return {
            distance: route.distance.text,
            duration: route.duration.text,
        };
    } catch (error) {
        logger.error('Error getting travel info:', error);
        return {
            distance: 'Unknown',
            duration: 'Unknown'
        };
    }
};

export const getPlacePredictions = async (
    input: string,
    options?: {
        sessionToken?: string;
        location?: string;
        radius?: number;
    }
): Promise<PlacePrediction[]> => {
    try {
        const params: Record<string, unknown> = { input };
        if (options?.sessionToken) params.sessiontoken = options.sessionToken;
        if (options?.location) {
            params.location = options.location;
            params.radius = options.radius ?? 50000;
        }

        const response = await googleMapsClient.get<GooglePlacesAutocompleteResponse>(
            ENDPOINTS.placesAutocomplete,
            params,
            { cacheTTL: CACHE_TTL.PLACES_AUTOCOMPLETE, timeout: 5000 }
        );

        if (response.status !== 'OK') {
            logger.warn('API returned non-OK status:', response.status);
            return [];
        }

        return response.predictions;
    } catch (error: unknown) {
        logger.error('Failed to get place predictions:', error);
        return [];
    }
};

export const getPlaceDetailsForGeocoding = async (
    placeId: string,
    sessionToken?: string
): Promise<{ latitude: number; longitude: number; formattedAddress: string }> => {
    const params: Record<string, unknown> = {
        place_id: placeId,
        fields: 'geometry,formatted_address',
    };
    if (sessionToken) params.sessiontoken = sessionToken;

    const response = await googleMapsClient.get<GooglePlaceDetailsGeoResponse>(
        ENDPOINTS.placeDetails,
        params,
        { cacheTTL: CACHE_TTL.PLACE_DETAILS }
    );

    if (response.status !== 'OK') {
        throw new Error(`Place details request failed: ${response.status}`);
    }

    return {
        latitude: response.result.geometry.location.lat,
        longitude: response.result.geometry.location.lng,
        formattedAddress: response.result.formatted_address,
    };
};

export const getPlaceDetails = async (placeId: string): Promise<{
    phoneNumber?: string;
    businessHours?: string[];
    editorialSummary?: string;
}> => {
    try {
        const response = await googleMapsClient.get<GooglePlaceDetailsResponse>(
            ENDPOINTS.placeDetails,
            {
                place_id: placeId,
                fields: 'formatted_phone_number,opening_hours,editorial_summary',
            },
            { cacheTTL: CACHE_TTL.PLACE_DETAILS }
        );

        if (response.status !== 'OK') {
            logger.warn(`Failed to get place details for ${placeId}: ${response.status}`);
            return {};
        }

        return {
            phoneNumber: response.result.formatted_phone_number,
            businessHours: response.result.opening_hours?.weekday_text,
            editorialSummary: response.result.editorial_summary?.overview,
        };
    } catch (error) {
        logger.error('Error fetching place details:', error);
        return {};
    }
};
