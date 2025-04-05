import axios from 'axios';
import { GOOGLE_MAPS_API_KEY } from '@env';
import { Location, Restaurant, TravelMode, PlaceCategory } from '../types';

interface GooglePlacesResponse {
    results: {
        place_id: string;
        name: string;
        rating?: number;
        vicinity?: string;
        geometry: {
            location: {
                lat: number;
                lng: number;
            };
        };
        photos?: {
            photo_reference: string;
        }[];
        user_ratings_total?: number;
        price_level?: number;
        types?: string[];
    }[];
}

interface GoogleDirectionsResponse {
    routes: {
        legs: {
            distance: {
                text: string;
            };
            duration: {
                text: string;
            };
        }[];
    }[];
}

interface PlacePrediction {
    description: string;
    place_id: string;
}

interface GooglePlacesAutocompleteResponse {
    predictions: PlacePrediction[];
    status: string;
}

interface PlaceDetailsResponse {
    result: {
        formatted_phone_number?: string;
        opening_hours?: {
            weekday_text?: string[];
        };
        // ... other details available in the API
    };
    status: string;
}

export const searchRestaurants = async (
    location: Location,
    category: PlaceCategory
): Promise<Restaurant[]> => {
    try {
        // console.log(`Searching for ${category} near ${location.latitude},${location.longitude}`);

        const response = await axios.get<GooglePlacesResponse>(
            `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.latitude
            },${location.longitude}&radius=1500&type=${category}&key=${GOOGLE_MAPS_API_KEY}`
        );

        if (response.data.results.length === 0) {
            // console.log(`No ${category} found near the specified location`);
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
    } catch (error: any) {
        console.error('Error searching for places:', error);

        // Check if it's an Axios error with a response
        if (error && error.response && error.response.data) {
            console.error('API response error:', error.response.data);

            // Check for specific API errors
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
): Promise<{ distance: string; duration: string }> => {
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
        console.error('Error getting travel info:', error);
        return {
            distance: 'Unknown',
            duration: 'Unknown'
        };
    }
};

export const getPlacePredictions = async (input: string): Promise<PlacePrediction[]> => {
    try {
        console.log('getPlacePredictions called with input:', input);
        console.log('API Key available:', !!GOOGLE_MAPS_API_KEY);
        
        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
            input
        )}&key=${GOOGLE_MAPS_API_KEY}`;
        console.log('Requesting URL:', url);
        
        const response = await axios.get<GooglePlacesAutocompleteResponse>(url);
        
        console.log('API Response status:', response.data.status);
        console.log('API Response predictions count:', response.data.predictions?.length || 0);
        
        if (response.data.status !== 'OK') {
            console.warn('API returned non-OK status:', response.data.status);
            return [];
        }

        return response.data.predictions;
    } catch (error) {
        console.error('Failed to get place predictions:', error);
        // Type-safe error handling
        if (error && typeof error === 'object' && 'response' in error) {
            const axiosError = error as { response?: { data?: any } };
            if (axiosError.response?.data) {
                console.error('API error response:', axiosError.response.data);
            }
        }
        return [];
    }
};

export const getPlaceDetails = async (placeId: string): Promise<{
    phoneNumber?: string;
    businessHours?: string[];
}> => {
    try {
        const response = await axios.get<PlaceDetailsResponse>(
            `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_phone_number,opening_hours&key=${GOOGLE_MAPS_API_KEY}`
        );

        if (response.data.status !== 'OK') {
            console.warn(`Failed to get place details for ${placeId}: ${response.data.status}`);
            return {};
        }

        return {
            phoneNumber: response.data.result.formatted_phone_number,
            businessHours: response.data.result.opening_hours?.weekday_text,
        };
    } catch (error) {
        console.error('Error fetching place details:', error);
        return {};
    }
}; 