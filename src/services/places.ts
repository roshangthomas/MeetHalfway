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

export const searchRestaurants = async (
    location: Location,
    category: PlaceCategory
): Promise<Restaurant[]> => {
    try {
        const response = await axios.get<GooglePlacesResponse>(
            `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.latitude
            },${location.longitude}&radius=1000&type=${category}&key=${GOOGLE_MAPS_API_KEY}`
        );

        return response.data.results.map((place) => ({
            id: place.place_id,
            name: place.name,
            rating: place.rating,
            address: place.vicinity,
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
            photoUrl: place.photos?.[0]
                ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_MAPS_API_KEY}`
                : undefined,
            totalRatings: place.user_ratings_total,
            priceLevel: place.price_level,
            types: place.types,
        }));
    } catch (error) {
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

        const route = response.data.routes[0].legs[0];
        return {
            distance: route.distance.text,
            duration: route.duration.text,
        };
    } catch (error) {
        throw new Error('Failed to get travel information');
    }
};

export const getPlacePredictions = async (input: string): Promise<PlacePrediction[]> => {
    try {
        const response = await axios.get<GooglePlacesAutocompleteResponse>(
            `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
                input
            )}&key=${GOOGLE_MAPS_API_KEY}`
        );

        if (response.data.status !== 'OK') {
            return [];
        }

        return response.data.predictions;
    } catch (error) {
        console.error('Failed to get place predictions:', error);
        return [];
    }
}; 