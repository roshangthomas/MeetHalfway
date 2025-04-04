import * as Location from 'expo-location';
import { LocationGeocodedAddress } from 'expo-location';
import axios from 'axios';
import { GOOGLE_MAPS_API_KEY } from '@env';
import { Location as LocationType } from '../types';
import { ERROR_MESSAGES } from '../constants';
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
    // Request permission to access location
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
        throw new Error(ERROR_MESSAGES.LOCATION_PERMISSION_DENIED);
    }

    try {
        // Get the current location
        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced
        });

        return {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
        };
    } catch (error) {
        console.error('Error getting current location:', error);
        throw new Error(ERROR_MESSAGES.USER_LOCATION_UNAVAILABLE);
    }
};

export const geocodeAddress = async (address: string): Promise<LocationType> => {
    try {
        // console.log(`Geocoding address: ${address}`);

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
        // console.log(`Calculating road midpoint between ${locationA.latitude},${locationA.longitude} and ${locationB.latitude},${locationB.longitude}`);

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

        // // // // console.log(`Total route distance: ${totalDistance}m, halfway point: ${halfDistance}m`);

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

/**
 * Finds optimal meeting places that minimize travel time difference between two people
 * and maximize venue quality.
 * 
 * @param locationA First person's location
 * @param locationB Second person's location
 * @param travelMode Mode of transportation (driving, walking, etc.)
 * @param categories Types of places to search for
 * @param maxResults Maximum number of results to return
 * @returns Promise with array of ranked restaurants with travel info
 */
export const findOptimalMeetingPlaces = async (
    locationA: LocationType,
    locationB: LocationType,
    travelMode: TravelMode,
    categories: PlaceCategory[],
    maxResults: number = 20
): Promise<Restaurant[]> => {
    try {
        // console.log(`Finding optimal meeting places between ${locationA.latitude},${locationA.longitude} and ${locationB.latitude},${locationB.longitude}`);

        // Use the new practical midpoint function instead of road midpoint
        let midpoint;
        try {
            midpoint = await findPracticalMidpoint(locationA, locationB, travelMode);
        } catch (error) {
            console.warn('Practical midpoint calculation failed, falling back to simple midpoint', error);
            midpoint = calculateMidpoint(locationA, locationB);
        }

        // Search for venues near this midpoint for each category
        let allVenues: Restaurant[] = [];

        for (const category of categories) {
            try {
                const response = await axios.get<GooglePlacesResponse>(
                    `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${midpoint.latitude},${midpoint.longitude}&radius=5000&type=${category}&key=${GOOGLE_MAPS_API_KEY}`
                );

                if (!response.data.results || response.data.results.length === 0) {
                    // console.log(`No ${category} found near the midpoint`);
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

        // For each venue, calculate travel times from both locations
        const venuesWithTravelInfo = await Promise.all(
            allVenues.map(async (venue) => {
                try {
                    const venueLocation = {
                        latitude: venue.latitude,
                        longitude: venue.longitude
                    };

                    // Get travel info from location A to venue
                    const travelInfoA = await getTravelInfo(locationA, venueLocation, travelMode);

                    // Get travel info from location B to venue
                    const travelInfoB = await getTravelInfo(locationB, venueLocation, travelMode);

                    // Parse travel times (convert "10 mins" to 10)
                    const travelTimeA = parseTravelTime(travelInfoA.duration);
                    const travelTimeB = parseTravelTime(travelInfoB.duration);

                    // Calculate time difference (fairness metric)
                    const timeDifference = Math.abs(travelTimeA - travelTimeB);

                    // Calculate a score based on:
                    // 1. Low time difference (more fair)
                    // 2. High rating
                    // 3. Total travel time (lower is better)
                    const fairnessScore = 100 - Math.min(timeDifference, 100); // 0-100, higher is better
                    const ratingScore = (venue.rating || 3) * 20; // 0-100, higher is better
                    const totalTimeScore = 100 - Math.min((travelTimeA + travelTimeB) / 2, 100); // 0-100, higher is better

                    // Weighted score (can be adjusted based on priorities)
                    const score = (fairnessScore * 0.5) + (ratingScore * 0.3) + (totalTimeScore * 0.2);

                    return {
                        ...venue,
                        travelTimeA,
                        travelTimeB,
                        timeDifference,
                        totalTravelTime: travelTimeA + travelTimeB,
                        fairnessScore,
                        score,
                        // Add formatted travel info for display
                        distanceA: travelInfoA.distance,
                        durationA: travelInfoA.duration,
                        distanceB: travelInfoB.distance,
                        durationB: travelInfoB.duration,
                        // Use the average for the main distance/duration fields
                        distance: travelInfoA.distance, // We'll use person A's distance as the reference
                        duration: travelInfoA.duration, // We'll use person A's duration as the reference
                    };
                } catch (error) {
                    console.error(`Error calculating travel info for ${venue.name}:`, error);
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
const getTravelInfo = async (
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
const parseTravelTime = (durationText: string): number => {
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

/**
 * Finds a practical midpoint between two locations that is suitable for meeting.
 * This function:
 * 1. Calculates the road midpoint
 * 2. Checks for suitable venues nearby
 * 3. Expands search if needed
 * 4. Scores venues based on travel fairness, total travel time, and venue quality
 * 
 * @param locationA First person's location
 * @param locationB Second person's location
 * @param travelMode Mode of transportation (driving, walking, etc.)
 * @returns Promise with the most practical meeting point
 */
export const findPracticalMidpoint = async (
    locationA: LocationType,
    locationB: LocationType,
    travelMode: TravelMode = 'driving'
): Promise<LocationType> => {
    try {
        // (`Finding practical midpoint between ${locationA.latitude},${locationA.longitude} and ${locationB.latitude},${locationB.longitude}`);

        // Step 1: Calculate road midpoint
        let roadMidpoint;
        try {
            roadMidpoint = await calculateRoadMidpoint(locationA, locationB);
        } catch (error) {
            console.warn('Road midpoint calculation failed, falling back to simple midpoint', error);
            roadMidpoint = calculateMidpoint(locationA, locationB);
        }

        // Define venue types that are suitable for meetings
        const venueTypes = [
            'restaurant', 'cafe', 'bar', 'shopping_mall', 'department_store',
            'supermarket', 'bakery', 'library', 'park', 'book_store', 'movie_theater'
        ].join('|');

        // Step 2: Search for venues with progressively larger radii until we find some
        let venues: any[] = [];
        const searchRadii = [500, 1500, 3000, 5000, 10000, 15000, 20000, 25000, 30000, 35000, 40000, 45000, 50000]; // Increasing search radii in meters

        for (const radius of searchRadii) {
            // console.log(`Searching for venues within ${radius}m of midpoint`);
            venues = await searchNearbyVenues(roadMidpoint, radius, venueTypes);

            if (venues.length > 0) {
                // console.log(`Found ${venues.length} venues within ${radius}m`);
                break;
            }
        }

        // If still no venues, return the road midpoint
        if (venues.length === 0) {
            // console.log('No venues found in any search radius, returning road midpoint');
            return roadMidpoint;
        }

        // Step 4: Score venues based on multiple factors
        const scoredVenues = await Promise.all(
            venues.map(async (venue) => {
                const venueLocation = {
                    latitude: venue.geometry.location.lat,
                    longitude: venue.geometry.location.lng
                };

                // Get travel info from both locations
                const travelInfoA = await getTravelInfo(locationA, venueLocation, travelMode);
                const travelInfoB = await getTravelInfo(locationB, venueLocation, travelMode);

                // Parse travel times
                const travelTimeA = parseTravelTime(travelInfoA.duration);
                const travelTimeB = parseTravelTime(travelInfoB.duration);

                // Calculate metrics
                const timeDifference = Math.abs(travelTimeA - travelTimeB);
                const totalTravelTime = travelTimeA + travelTimeB;

                // Venue quality factors
                const rating = venue.rating || 3;
                const userRatingsTotal = venue.user_ratings_total || 0;

                // Check if venue is on a major road (using types)
                const isOnMajorRoad = venue.types?.some((type: string) =>
                    ['route', 'street_address', 'point_of_interest'].includes(type)
                ) || false;

                // Calculate scores (0-100 scale for each component)
                const fairnessScore = 100 - Math.min(timeDifference, 100); // Lower difference is better
                const travelTimeScore = 100 - Math.min(totalTravelTime / 2, 100); // Lower total time is better
                const qualityScore = Math.min((rating * 20) * (Math.min(userRatingsTotal, 100) / 100), 100); // Higher rating and more reviews is better
                const accessibilityScore = isOnMajorRoad ? 100 : 50; // Bonus for being on major road

                // Weighted total score (adjust weights based on priorities)
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
                    fairnessScore,
                    travelTimeScore,
                    qualityScore,
                    accessibilityScore,
                    travelTimeA,
                    travelTimeB,
                    rating
                };
            })
        );

        // Sort venues by score (highest first)
        scoredVenues.sort((a, b) => b.score - a.score);

        // Log the top venue for debugging
        if (scoredVenues.length > 0) {
            const topVenue = scoredVenues[0];
            // console.log(`Selected practical midpoint: ${topVenue.name} with score ${topVenue.score.toFixed(2)}`);
            // console.log(`Travel times: Person A: ${topVenue.travelTimeA}min, Person B: ${topVenue.travelTimeB}min`);
        }

        // Return the location of the highest-scoring venue
        return scoredVenues.length > 0 ? scoredVenues[0].location : roadMidpoint;
    } catch (error) {
        console.error('Error finding practical midpoint:', error);
        // Fallback to simple midpoint in case of error
        return calculateMidpoint(locationA, locationB);
    }
};

/**
 * Helper function to search for venues near a location
 */
const searchNearbyVenues = async (
    location: LocationType,
    radius: number,
    types: string
): Promise<any[]> => {
    try {
        const response = await axios.get<GooglePlacesResponse>(
            `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
            `location=${location.latitude},${location.longitude}` +
            `&radius=${radius}` +
            `&type=${types}` +
            `&key=${GOOGLE_MAPS_API_KEY}`
        );

        if (response.data.status !== 'OK' || !response.data.results) {
            return [];
        }

        return response.data.results;
    } catch (error) {
        console.error('Error searching for nearby venues:', error);
        return [];
    }
}; 