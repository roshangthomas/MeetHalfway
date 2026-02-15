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
    travelTimes: number[];
    distances: string[];
    durations: string[];
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
    origins: Location[],
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
            const batchResults = await processBatch(origins, batch, mode);
            results.push(...batchResults);
        } catch (error) {
            logger.error(`Error processing batch ${i / BATCH_SIZE + 1}:`, error);
            batch.forEach((venue) => {
                results.push({
                    venueId: venue.id,
                    travelTimes: origins.map(() => 9999),
                    distances: origins.map(() => 'Unknown'),
                    durations: origins.map(() => 'Unknown'),
                });
            });
        }
    }

    return results;
};

const processBatch = async (
    origins: Location[],
    venues: VenueLocation[],
    mode: TravelMode
): Promise<BatchTravelResult[]> => {
    const originsStr = origins.map(formatLocation).join('|');
    const destinations = venues.map((v) => `${v.latitude},${v.longitude}`).join('|');

    logger.info(`Distance Matrix: Processing ${venues.length} venues for ${origins.length} origins`);

    const response = await googleMapsClient.get<DistanceMatrixResponse>(
        ENDPOINTS.distanceMatrix,
        { origins: originsStr, destinations, mode },
        { cacheTTL: CACHE_TTL.DISTANCE_MATRIX }
    );

    if (response.status !== 'OK') {
        throw new Error(`Distance Matrix API returned status: ${response.status}`);
    }

    return venues.map((venue, venueIndex) => {
        const travelTimes: number[] = [];
        const distances: string[] = [];
        const durations: string[] = [];

        for (let originIndex = 0; originIndex < origins.length; originIndex++) {
            const element = response.rows[originIndex]?.elements[venueIndex];
            const isValid = element?.status === 'OK';

            travelTimes.push(isValid ? secondsToMinutes(element.duration?.value || 0) : 9999);
            distances.push(isValid ? element.distance?.text || 'Unknown' : 'Unknown');
            durations.push(isValid ? element.duration?.text || 'Unknown' : 'Unknown');
        }

        return { venueId: venue.id, travelTimes, distances, durations };
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
