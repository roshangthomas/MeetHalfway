import { Location, Restaurant, TravelMode, PlaceCategory } from '../types';
import {
    GooglePlacesResponse,
    GoogleDirectionsResponse,
    GooglePlacesAutocompleteResponse,
    GooglePlaceDetailsResponse,
    PlacePrediction,
    TravelInfo,
} from '../types/api';
import { logger } from '../utils';
import { SEARCH_RADIUS } from '../constants';
import { googleMapsClient, ENDPOINTS, CACHE_TTL } from '../api/client';
import { GOOGLE_MAPS_API_KEY } from '@env';

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

        return response.results.map((place) => ({
            id: place.place_id,
            name: place.name,
            rating: place.rating || 0,
            address: place.vicinity || 'Address not available',
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
            photoUrl: place.photos?.[0]
                ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=200&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_MAPS_API_KEY}`
                : undefined,
            totalRatings: place.user_ratings_total || 0,
            priceLevel: place.price_level || 0,
            types: place.types || [],
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

export const getPlacePredictions = async (input: string): Promise<PlacePrediction[]> => {
    try {
        const response = await googleMapsClient.get<GooglePlacesAutocompleteResponse>(
            ENDPOINTS.placesAutocomplete,
            { input: encodeURIComponent(input) },
            { cacheTTL: CACHE_TTL.PLACES_AUTOCOMPLETE }
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

export const getPlaceDetails = async (placeId: string): Promise<{
    phoneNumber?: string;
    businessHours?: string[];
}> => {
    try {
        const response = await googleMapsClient.get<GooglePlaceDetailsResponse>(
            ENDPOINTS.placeDetails,
            {
                place_id: placeId,
                fields: 'formatted_phone_number,opening_hours',
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
        };
    } catch (error) {
        logger.error('Error fetching place details:', error);
        return {};
    }
};
