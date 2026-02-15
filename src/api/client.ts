import axios, { AxiosInstance, AxiosError } from 'axios';
import { GOOGLE_MAPS_API_KEY } from '@env';
import { ERROR_MESSAGES } from '../constants';
import { logger, isAxiosError } from '../utils';

interface CacheEntry<T = unknown> {
    data: T;
    timestamp: number;
}

class GoogleMapsApiClient {
    private client: AxiosInstance;
    private cache: Map<string, CacheEntry<unknown>> = new Map();
    private readonly DEFAULT_CACHE_TTL = 5 * 60 * 1000;

    constructor() {
        this.client = axios.create({
            baseURL: 'https://maps.googleapis.com/maps/api',
            timeout: 15000,
            params: { key: GOOGLE_MAPS_API_KEY },
        });

        this.setupInterceptors();
    }

    private setupInterceptors(): void {
        this.client.interceptors.request.use(
            (config) => {
                logger.info(`API Request: ${config.url}`);
                return config;
            },
            (error) => {
                logger.error('Request error:', error);
                return Promise.reject(error);
            }
        );

        this.client.interceptors.response.use(
            (response) => {
                const status = response.data?.status;
                if (status && status !== 'OK' && status !== 'ZERO_RESULTS') {
                    logger.warn(`API returned status: ${status}`);
                }
                return response;
            },
            (error: unknown) => {
                if (isAxiosError(error)) {
                    const axiosError = error as AxiosError<{ status?: string }>;
                    if (axiosError.response?.data?.status) {
                        const status = axiosError.response.data.status;
                        switch (status) {
                            case 'OVER_QUERY_LIMIT':
                                throw new Error(ERROR_MESSAGES.API_QUOTA_EXCEEDED);
                            case 'REQUEST_DENIED':
                                throw new Error(ERROR_MESSAGES.API_KEY_INVALID);
                            case 'INVALID_REQUEST':
                                throw new Error(ERROR_MESSAGES.GEOCODING_FAILED);
                        }
                    }

                    if (!axiosError.response && axiosError.request) {
                        throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
                    }
                }

                throw error;
            }
        );
    }

    private getCacheKey(endpoint: string, params?: Record<string, unknown>): string {
        const sortedParams = params
            ? Object.keys(params).sort().map((key) => `${key}=${params[key]}`).join('&')
            : '';
        return `${endpoint}?${sortedParams}`;
    }

    private isCacheValid(entry: CacheEntry, ttl: number): boolean {
        return Date.now() - entry.timestamp < ttl;
    }

    async get<T>(
        endpoint: string,
        params?: Record<string, unknown>,
        options: { cacheTTL?: number; skipCache?: boolean; timeout?: number } = {}
    ): Promise<T> {
        const { cacheTTL = this.DEFAULT_CACHE_TTL, skipCache = false, timeout } = options;
        const cacheKey = this.getCacheKey(endpoint, params);

        if (!skipCache) {
            const cached = this.cache.get(cacheKey);
            if (cached && this.isCacheValid(cached, cacheTTL)) {
                logger.info(`Cache hit for: ${endpoint}`);
                return cached.data as T;
            }
        }

        const response = await this.client.get<T>(endpoint, { params, ...(timeout ? { timeout } : {}) });

        this.cache.set(cacheKey, {
            data: response.data,
            timestamp: Date.now(),
        });

        return response.data;
    }

    clearCache(): void {
        this.cache.clear();
        logger.info('API cache cleared');
    }

    clearCacheFor(endpointPattern: string): void {
        for (const key of this.cache.keys()) {
            if (key.includes(endpointPattern)) {
                this.cache.delete(key);
            }
        }
    }

    getCacheStats(): { size: number; keys: string[] } {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
        };
    }
}

export const googleMapsClient = new GoogleMapsApiClient();

export const ENDPOINTS = {
    geocode: '/geocode/json',
    directions: '/directions/json',
    distanceMatrix: '/distancematrix/json',
    placesNearby: '/place/nearbysearch/json',
    placesAutocomplete: '/place/autocomplete/json',
    placeDetails: '/place/details/json',
    placePhoto: '/place/photo',
} as const;

export const CACHE_TTL = {
    GEOCODE: 24 * 60 * 60 * 1000,
    DIRECTIONS: 5 * 60 * 1000,
    DISTANCE_MATRIX: 5 * 60 * 1000,
    PLACES_NEARBY: 10 * 60 * 1000,
    PLACES_AUTOCOMPLETE: 60 * 1000,
    PLACE_DETAILS: 30 * 60 * 1000,
} as const;
