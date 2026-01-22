import axios from 'axios';
import { GOOGLE_MAPS_API_KEY } from '@env';
import { ERROR_MESSAGES } from '../constants/index';

interface AxiosErrorLike {
    isAxiosError: boolean;
    response?: { data?: { status?: string } };
    request?: unknown;
}

const isAxiosError = (error: unknown): error is AxiosErrorLike => {
    return error !== null && typeof error === 'object' && 'isAxiosError' in error;
};

export const googleMapsClient = axios.create({
    baseURL: 'https://maps.googleapis.com/maps/api',
    params: {
        key: GOOGLE_MAPS_API_KEY,
    },
});

googleMapsClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (isAxiosError(error) && error.response?.data?.status) {
            const status = error.response.data.status;

            switch (status) {
                case 'OVER_QUERY_LIMIT':
                    throw new Error(ERROR_MESSAGES.API_QUOTA_EXCEEDED);
                case 'REQUEST_DENIED':
                    throw new Error(ERROR_MESSAGES.API_KEY_INVALID);
                case 'ZERO_RESULTS':
                    throw new Error(ERROR_MESSAGES.PARTNER_LOCATION_INVALID);
                case 'INVALID_REQUEST':
                    throw new Error(ERROR_MESSAGES.GEOCODING_FAILED);
            }
        }

        if (isAxiosError(error) && !error.response && error.request) {
            throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
        }

        throw error;
    }
);

export const ENDPOINTS = {
    geocode: '/geocode/json',
    directions: '/directions/json',
    placesNearby: '/place/nearbysearch/json',
    placesAutocomplete: '/place/autocomplete/json',
    placeDetails: '/place/details/json',
    placePhoto: '/place/photo',
} as const;

