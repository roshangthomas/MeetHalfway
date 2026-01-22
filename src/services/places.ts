import axios from 'axios';
import { GOOGLE_MAPS_API_KEY } from '@env';
import { Location, Restaurant, TravelMode, PlaceCategory } from '../types';
import {
    GooglePlacesResponse,
    GoogleDirectionsResponse,
    GooglePlacesAutocompleteResponse,
    GooglePlaceDetailsResponse,
    PlacePrediction,
    TravelInfo,
} from '../types/api';
import { logger } from '../utils/logger';

interface AxiosErrorLike {
    isAxiosError: boolean;
    response?: { data?: { status?: string } };
}

const isAxiosError = (error: unknown): error is AxiosErrorLike => {
    return error !== null && typeof error === 'object' && 'isAxiosError' in error;
};

export const searchRestaurants = async (
    location: Location,
    category: PlaceCategory
): Promise<Restaurant[]> => {
    try {
        const response = await axios.get<GooglePlacesResponse>(
            `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.latitude
            },${location.longitude}&radius=1500&type=${category}&key=${GOOGLE_MAPS_API_KEY}`
        );

        if (response.data.results.length === 0) {
            return [];
        }

        return response.data.results.map((place) => ({
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
    } catch (error: unknown) {
        logger.error('Error searching for places:', error);

        if (isAxiosError(error) && error.response?.data) {
            logger.error('API response error:', error.response.data);

            const status = error.response.data.status;
            if (status === 'OVER_QUERY_LIMIT') {
                throw new Error('Google Places API query limit exceeded. Please try again later.');
            } else if (status === 'REQUEST_DENIED') {
                throw new Error('API request denied. Please check your API key configuration.');
            }
        }
        throw new Error('Failed to search places');
    }
};

export const getTravelInfo = async (
    origin: Location,
    destination: Location,
    mode: TravelMode
): Promise<TravelInfo> => {
    try {
        const response = await axios.get<GoogleDirectionsResponse>(
            `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude
            }&destination=${destination.latitude},${destination.longitude}&mode=${mode}&key=${GOOGLE_MAPS_API_KEY}`
        );

        if (!response.data.routes || response.data.routes.length === 0) {
            return {
                distance: 'Unknown',
                duration: 'Unknown'
            };
        }

        const route = response.data.routes[0].legs[0];
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
        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
            input
        )}&key=${GOOGLE_MAPS_API_KEY}`;

        const response = await axios.get<GooglePlacesAutocompleteResponse>(url);

        if (response.data.status !== 'OK') {
            logger.warn('API returned non-OK status:', response.data.status);
            return [];
        }

        return response.data.predictions;
    } catch (error: unknown) {
        logger.error('Failed to get place predictions:', error);

        if (isAxiosError(error) && error.response?.data) {
            logger.error('API error response:', error.response.data);
        }
        return [];
    }
};

export const getPlaceDetails = async (placeId: string): Promise<{
    phoneNumber?: string;
    businessHours?: string[];
}> => {
    try {
        const response = await axios.get<GooglePlaceDetailsResponse>(
            `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_phone_number,opening_hours&key=${GOOGLE_MAPS_API_KEY}`
        );

        if (response.data.status !== 'OK') {
            logger.warn(`Failed to get place details for ${placeId}: ${response.data.status}`);
            return {};
        }

        return {
            phoneNumber: response.data.result.formatted_phone_number,
            businessHours: response.data.result.opening_hours?.weekday_text,
        };
    } catch (error) {
        logger.error('Error fetching place details:', error);
        return {};
    }
};
