import * as Location from 'expo-location';
import { LocationGeocodedAddress } from 'expo-location';
import axios from 'axios';
import { GOOGLE_MAPS_API_KEY } from '@env';
import { Location as LocationType } from '../types';
import { ERROR_MESSAGES } from '../constants/index';

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

interface GoogleDirectionsResponse {
    routes: {
        legs: {
            distance: {
                text: string;
                value: number; // distance in meters
            };
            duration: {
                text: string;
                value: number; // duration in seconds
            };
            steps: {
                distance: {
                    value: number; // distance in meters
                };
                duration: {
                    value: number; // duration in seconds
                };
                start_location: {
                    lat: number;
                    lng: number;
                };
                end_location: {
                    lat: number;
                    lng: number;
                };
            }[];
        }[];
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
        console.log(`Geocoding address: ${address}`);

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
    } catch (error: any) {
        console.error('Geocoding error:', error);

        if (error && error.response === undefined && error.request) {
            throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
        }

        // If it's a custom error we created above, rethrow it
        if (error instanceof Error &&
            [
                ERROR_MESSAGES.PARTNER_LOCATION_INVALID,
                ERROR_MESSAGES.API_KEY_INVALID,
                ERROR_MESSAGES.API_QUOTA_EXCEEDED,
                ERROR_MESSAGES.GEOCODING_FAILED
            ].includes(error.message)) {
            throw error;
        }

        // Default error
        throw new Error(ERROR_MESSAGES.GEOCODING_FAILED);
    }
};

export const calculateMidpoint = (locationA: LocationType, locationB: LocationType): LocationType => {
    return {
        latitude: (locationA.latitude + locationB.latitude) / 2,
        longitude: (locationA.longitude + locationB.longitude) / 2,
    };
};

/**
 * Calculates a midpoint based on actual road distance between two locations.
 * This finds a point that's approximately halfway along the route by road.
 */
export const calculateRoadMidpoint = async (
    locationA: LocationType,
    locationB: LocationType
): Promise<LocationType> => {
    try {
        console.log(`Calculating road midpoint between ${locationA.latitude},${locationA.longitude} and ${locationB.latitude},${locationB.longitude}`);

        // Get directions between the two points
        const response = await axios.get<GoogleDirectionsResponse>(
            `https://maps.googleapis.com/maps/api/directions/json?origin=${locationA.latitude},${locationA.longitude}&destination=${locationB.latitude},${locationB.longitude}&key=${GOOGLE_MAPS_API_KEY}`
        );

        if (!response.data.routes || response.data.routes.length === 0) {
            console.error('No route found between locations');
            throw new Error(ERROR_MESSAGES.ROUTE_NOT_FOUND);
        }

        const route = response.data.routes[0];
        const legs = route.legs[0];
        const steps = legs.steps;

        // Calculate total distance
        const totalDistance = legs.distance.value; // in meters
        const halfDistance = totalDistance / 2;

        console.log(`Total route distance: ${totalDistance}m, halfway point: ${halfDistance}m`);

        // Find the midpoint by traversing the route steps
        let distanceCovered = 0;
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            const stepDistance = step.distance.value;

            if (distanceCovered + stepDistance >= halfDistance) {
                // This step contains our midpoint
                const remainingDistance = halfDistance - distanceCovered;
                const ratio = remainingDistance / stepDistance;

                // Interpolate between start and end points of this step
                const startLat = step.start_location.lat;
                const startLng = step.start_location.lng;
                const endLat = step.end_location.lat;
                const endLng = step.end_location.lng;

                const midpoint = {
                    latitude: startLat + (endLat - startLat) * ratio,
                    longitude: startLng + (endLng - startLng) * ratio
                };

                console.log(`Found road midpoint at ${midpoint.latitude},${midpoint.longitude}`);
                return midpoint;
            }

            distanceCovered += stepDistance;
        }

        // If we get here, something went wrong with the calculation
        console.warn('Could not find exact road midpoint, falling back to simple midpoint');
        return calculateMidpoint(locationA, locationB);
    } catch (error) {
        console.error('Error calculating road midpoint:', error);
        // Fallback to simple midpoint
        console.warn('Falling back to simple midpoint calculation');
        return calculateMidpoint(locationA, locationB);
    }
}; 