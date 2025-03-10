import * as Location from 'expo-location';
import { LocationGeocodedAddress } from 'expo-location';
import axios from 'axios';
import { GOOGLE_MAPS_API_KEY } from '@env';
import { Location as LocationType } from '../types';
import { ERROR_MESSAGES } from '../constants/index';
import { PlaceCategory, Restaurant, TravelMode } from '../types';

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

/**
 * Calculates the simple midpoint between two locations
 */
export const calculateMidpoint = (locations: LocationType[]): LocationType => {
    if (locations.length === 0) {
        throw new Error('No locations provided to calculate midpoint');
    }

    if (locations.length === 1) {
        return locations[0];
    }

    // Calculate the average of all latitudes and longitudes
    const totalLat = locations.reduce((sum, loc) => sum + loc.latitude, 0);
    const totalLng = locations.reduce((sum, loc) => sum + loc.longitude, 0);

    return {
        latitude: totalLat / locations.length,
        longitude: totalLng / locations.length,
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
        return calculateMidpoint([locationA, locationB]);
    } catch (error) {
        console.error('Error calculating road midpoint:', error);
        // Fallback to simple midpoint
        console.warn('Falling back to simple midpoint calculation');
        return calculateMidpoint([locationA, locationB]);
    }
};

/**
 * Calculates a midpoint between multiple locations (3 or more)
 * Uses a weighted approach based on travel times between locations
 */
export const calculateMultiPointMidpoint = async (
    locations: LocationType[],
    travelMode: TravelMode = 'driving'
): Promise<LocationType> => {
    if (locations.length <= 1) {
        throw new Error('Need at least 2 locations to calculate a midpoint');
    }

    if (locations.length === 2) {
        // For two locations, use the road midpoint calculation
        return calculateRoadMidpoint(locations[0], locations[1]);
    }

    try {
        console.log(`Calculating midpoint between ${locations.length} locations`);

        // Start with a simple geometric midpoint as our initial guess
        let midpoint = calculateMidpoint(locations);

        // We'll use an iterative approach to refine the midpoint
        // This is a simplified version of the "weighted geometric median" algorithm

        // First, calculate travel times from each location to our initial midpoint
        const travelTimes: number[] = [];

        for (const location of locations) {
            try {
                const travelInfo = await getTravelInfo(location, midpoint, travelMode);
                const minutes = parseTravelTime(travelInfo.duration);
                travelTimes.push(minutes);
            } catch (error) {
                console.warn('Error getting travel time, using default weight', error);
                travelTimes.push(30); // Default 30 minutes if we can't get actual time
            }
        }

        // Calculate total travel time
        const totalTravelTime = travelTimes.reduce((sum, time) => sum + time, 0);

        // If any location has more than 70% of the total travel time,
        // shift the midpoint closer to that location
        const maxTimeIndex = travelTimes.indexOf(Math.max(...travelTimes));
        const maxTimePercentage = travelTimes[maxTimeIndex] / totalTravelTime;

        if (maxTimePercentage > 0.7) {
            // Shift midpoint 30% closer to the farthest location
            const farLocation = locations[maxTimeIndex];
            midpoint = {
                latitude: midpoint.latitude + (farLocation.latitude - midpoint.latitude) * 0.3,
                longitude: midpoint.longitude + (farLocation.longitude - midpoint.longitude) * 0.3
            };
        }

        // Return the refined midpoint
        return midpoint;
    } catch (error) {
        console.error('Error calculating multi-point midpoint:', error);
        // Fallback to simple geometric midpoint
        return calculateMidpoint(locations);
    }
};

/**
 * Finds optimal meeting places that minimize travel time difference between multiple people
 * and maximize venue quality.
 * 
 * @param locations Array of all participants' locations
 * @param travelMode Mode of transportation (driving, walking, etc.)
 * @param categories Types of places to search for
 * @param maxResults Maximum number of results to return
 * @returns Promise with array of ranked restaurants with travel info
 */
export const findOptimalMeetingPlaces = async (
    locations: LocationType[],
    travelMode: TravelMode,
    categories: PlaceCategory[],
    maxResults: number = 20
): Promise<Restaurant[]> => {
    try {
        console.log(`Finding optimal meeting places between ${locations.length} locations`);

        // First get an approximate midpoint using multi-point calculation
        let midpoint;
        try {
            midpoint = await calculateMultiPointMidpoint(locations, travelMode);
        } catch (error) {
            console.warn('Multi-point midpoint calculation failed, falling back to simple midpoint', error);
            midpoint = calculateMidpoint(locations);
        }

        // Search for venues near this midpoint for each category
        let allVenues: Restaurant[] = [];

        for (const category of categories) {
            try {
                const response = await axios.get<GooglePlacesResponse>(
                    `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${midpoint.latitude},${midpoint.longitude}&radius=1500&type=${category}&key=${GOOGLE_MAPS_API_KEY}`
                );

                if (!response.data.results || response.data.results.length === 0) {
                    console.log(`No ${category} found near the midpoint`);
                    continue;
                }

                const venues = response.data.results.map((place) => ({
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
                console.error(`Error searching for ${category}:`, error);
            }
        }

        // Remove duplicates
        allVenues = allVenues.filter((venue, index, self) =>
            index === self.findIndex((v) => v.id === venue.id)
        );

        if (allVenues.length === 0) {
            throw new Error('No venues found near the midpoint');
        }

        // For each venue, calculate travel times from all locations
        const venuesWithTravelInfo = await Promise.all(
            allVenues.map(async (venue) => {
                try {
                    const venueLocation = {
                        latitude: venue.latitude,
                        longitude: venue.longitude
                    };

                    // Get travel info from all locations to venue
                    const travelInfos = await Promise.all(
                        locations.map(location => getTravelInfo(location, venueLocation, travelMode))
                    );

                    // Parse travel times (convert "10 mins" to 10)
                    const travelTimes = travelInfos.map(info => parseTravelTime(info.duration));

                    // Calculate max time difference (fairness metric)
                    const maxTime = Math.max(...travelTimes);
                    const minTime = Math.min(...travelTimes);
                    const timeDifference = maxTime - minTime;

                    // Calculate average travel time
                    const avgTravelTime = travelTimes.reduce((sum, time) => sum + time, 0) / travelTimes.length;

                    // Calculate a score based on:
                    // 1. Low time difference (more fair)
                    // 2. High rating
                    // 3. Total travel time (lower is better)
                    const fairnessScore = 100 - Math.min(timeDifference, 100); // 0-100, higher is better
                    const ratingScore = (venue.rating || 3) * 20; // 0-100, higher is better
                    const totalTimeScore = 100 - Math.min(avgTravelTime, 100); // 0-100, higher is better

                    // Weighted score (can be adjusted based on priorities)
                    const score = (fairnessScore * 0.5) + (ratingScore * 0.3) + (totalTimeScore * 0.2);

                    // Store travel info for the first location (user) for display purposes
                    const userTravelInfo = travelInfos[0];

                    return {
                        ...venue,
                        travelTimes,
                        timeDifference,
                        avgTravelTime,
                        fairnessScore,
                        score,
                        // Add formatted travel info for display
                        distance: userTravelInfo.distance,
                        duration: userTravelInfo.duration,
                        // Add travel info for each location
                        travelInfos: travelInfos.map((info, index) => ({
                            locationIndex: index,
                            distance: info.distance,
                            duration: info.duration
                        }))
                    };
                } catch (error) {
                    console.error(`Error calculating travel info for ${venue.name}:`, error);
                    return {
                        ...venue,
                        travelTimes: Array(locations.length).fill(9999),
                        timeDifference: 9999,
                        avgTravelTime: 9999,
                        fairnessScore: 0,
                        score: 0,
                        distance: 'Unknown',
                        duration: 'Unknown',
                        travelInfos: locations.map((_, index) => ({
                            locationIndex: index,
                            distance: 'Unknown',
                            duration: 'Unknown'
                        }))
                    };
                }
            })
        );

        // Sort venues by score (highest first)
        venuesWithTravelInfo.sort((a, b) => b.score - a.score);

        // Return top results
        return venuesWithTravelInfo.slice(0, maxResults);
    } catch (error) {
        console.error('Error finding optimal meeting places:', error);
        throw error;
    }
};

/**
 * Helper function to get travel information between two locations
 */
export const getTravelInfo = async (
    origin: LocationType,
    destination: LocationType,
    mode: TravelMode
): Promise<{ distance: string; duration: string }> => {
    try {
        const response = await axios.get<GoogleDirectionsResponse>(
            `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&mode=${mode}&key=${GOOGLE_MAPS_API_KEY}`
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

/**
 * Helper function to parse travel time from string format (e.g., "10 mins" -> 10)
 */
export const parseTravelTime = (durationText: string): number => {
    if (durationText === 'Unknown') return 9999;

    // Extract numbers from the duration text
    const matches = durationText.match(/(\d+)/g);
    if (!matches) return 9999;

    if (durationText.includes('hour') || durationText.includes('hr')) {
        // Handle hours and minutes format (e.g., "1 hour 20 mins")
        const hours = parseInt(matches[0], 10) || 0;
        const minutes = matches.length > 1 ? parseInt(matches[1], 10) : 0;
        return (hours * 60) + minutes;
    } else {
        // Handle minutes only format (e.g., "20 mins")
        return parseInt(matches[0], 10) || 0;
    }
}; 