import { googleMapsClient, ENDPOINTS, CACHE_TTL } from '../api/client';
import { Location, TravelMode } from '../types';
import { logger } from '../utils/logger';

interface DistanceMatrixElement {
    status: string;
    duration?: { text: string; value: number };
    distance?: { text: string; value: number };
}

interface DistanceMatrixRow {
    elements: DistanceMatrixElement[];
}

interface DistanceMatrixResponse {
    status: string;
    origin_addresses: string[];
    destination_addresses: string[];
    rows: DistanceMatrixRow[];
}

export interface BatchTravelResult {
    venueId: string;
    travelTimeA: number;
    travelTimeB: number;
    distanceA: string;
    distanceB: string;
    durationA: string;
    durationB: string;
}

export interface VenueLocation {
    id: string;
    latitude: number;
    longitude: number;
}

const secondsToMinutes = (seconds: number): number => Math.round(seconds / 60);

const formatLocation = (location: Location): string =>
    `${location.latitude},${location.longitude}`;

export const getBatchTravelInfo = async (
    locationA: Location,
    locationB: Location,
    venues: VenueLocation[],
    mode: TravelMode
): Promise<BatchTravelResult[]> => {
    if (venues.length === 0) {
        return [];
    }

    const BATCH_SIZE = 25;
    const results: BatchTravelResult[] = [];

    for (let i = 0; i < venues.length; i += BATCH_SIZE) {
        const batch = venues.slice(i, i + BATCH_SIZE);

        try {
            const batchResults = await processBatch(locationA, locationB, batch, mode);
            results.push(...batchResults);
        } catch (error) {
            logger.error(`Error processing batch ${i / BATCH_SIZE + 1}:`, error);
            batch.forEach((venue) => {
                results.push({
                    venueId: venue.id,
                    travelTimeA: 9999,
                    travelTimeB: 9999,
                    distanceA: 'Unknown',
                    distanceB: 'Unknown',
                    durationA: 'Unknown',
                    durationB: 'Unknown',
                });
            });
        }
    }

    return results;
};

const processBatch = async (
    locationA: Location,
    locationB: Location,
    venues: VenueLocation[],
    mode: TravelMode
): Promise<BatchTravelResult[]> => {
    const origins = `${formatLocation(locationA)}|${formatLocation(locationB)}`;
    const destinations = venues.map((v) => `${v.latitude},${v.longitude}`).join('|');

    logger.info(`Distance Matrix: Processing ${venues.length} venues`);

    const response = await googleMapsClient.get<DistanceMatrixResponse>(
        ENDPOINTS.distanceMatrix,
        { origins, destinations, mode },
        { cacheTTL: CACHE_TTL.DISTANCE_MATRIX }
    );

    if (response.status !== 'OK') {
        throw new Error(`Distance Matrix API returned status: ${response.status}`);
    }

    const fromA = response.rows[0]?.elements || [];
    const fromB = response.rows[1]?.elements || [];

    return venues.map((venue, index) => {
        const elementA = fromA[index];
        const elementB = fromB[index];
        const isValidA = elementA?.status === 'OK';
        const isValidB = elementB?.status === 'OK';

        return {
            venueId: venue.id,
            travelTimeA: isValidA ? secondsToMinutes(elementA.duration?.value || 0) : 9999,
            travelTimeB: isValidB ? secondsToMinutes(elementB.duration?.value || 0) : 9999,
            distanceA: isValidA ? elementA.distance?.text || 'Unknown' : 'Unknown',
            distanceB: isValidB ? elementB.distance?.text || 'Unknown' : 'Unknown',
            durationA: isValidA ? elementA.duration?.text || 'Unknown' : 'Unknown',
            durationB: isValidB ? elementB.duration?.text || 'Unknown' : 'Unknown',
        };
    });
};

export const getSingleTravelInfo = async (
    origin: Location,
    destination: Location,
    mode: TravelMode
): Promise<{ distance: string; duration: string; durationMinutes: number }> => {
    try {
        const response = await googleMapsClient.get<DistanceMatrixResponse>(
            ENDPOINTS.distanceMatrix,
            {
                origins: formatLocation(origin),
                destinations: formatLocation(destination),
                mode,
            },
            { cacheTTL: CACHE_TTL.DISTANCE_MATRIX }
        );

        if (
            response.status !== 'OK' ||
            !response.rows[0]?.elements[0] ||
            response.rows[0].elements[0].status !== 'OK'
        ) {
            return { distance: 'Unknown', duration: 'Unknown', durationMinutes: 9999 };
        }

        const element = response.rows[0].elements[0];
        return {
            distance: element.distance?.text || 'Unknown',
            duration: element.duration?.text || 'Unknown',
            durationMinutes: secondsToMinutes(element.duration?.value || 0),
        };
    } catch (error) {
        logger.error('Error getting single travel info:', error);
        return { distance: 'Unknown', duration: 'Unknown', durationMinutes: 9999 };
    }
};
