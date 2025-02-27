import * as Location from 'expo-location';
import { LocationGeocodedAddress } from 'expo-location';
import axios from 'axios';
import { GOOGLE_MAPS_API_KEY } from '@env';
import { Location as LocationType } from '../types';

interface GoogleGeocodingResponse {
    results: {
        geometry: {
            location: {
                lat: number;
                lng: number;
            };
        };
    }[];
    status: string;
}

export const getCurrentLocation = async (): Promise<LocationType> => {
    // Hardcoded location for Person 1 (user)
    return {
        latitude: 37.94565601059843,
        longitude: -121.98505722883536,
    };
};

export const geocodeAddress = async (address: string): Promise<LocationType> => {
    try {
        const response = await axios.get<GoogleGeocodingResponse>(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
                address
            )}&key=${GOOGLE_MAPS_API_KEY}`
        );

        if (response.data.results.length === 0) {
            throw new Error('Address not found');
        }

        const { lat, lng } = response.data.results[0].geometry.location;
        return { latitude: lat, longitude: lng };
    } catch (error) {
        throw new Error('Failed to geocode address');
    }
};

export const calculateMidpoint = (locationA: LocationType, locationB: LocationType): LocationType => {
    return {
        latitude: (locationA.latitude + locationB.latitude) / 2,
        longitude: (locationA.longitude + locationB.longitude) / 2,
    };
}; 