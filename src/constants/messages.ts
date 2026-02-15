export const ERROR_MESSAGES = {
    USER_LOCATION_UNAVAILABLE: 'Unable to get your current location. Please check your location permissions.',
    LOCATION_SERVICES: 'Failed to get your location. Please enable location services.',
    LOCATION_PERMISSION_DENIED: 'Location permission was denied. Please enable location services to use this feature or set your location manually.',
    LOCATION_PRECISION_LIMITED: 'Using approximate location. For better accuracy, enable precise location in settings.',
    PARTNER_LOCATION_INVALID: 'Unable to find that location. Please enter a valid address.',
    GEOCODING_FAILED: 'Failed to convert address to coordinates. Please enter a valid address.',
    RESTAURANT_SEARCH_FAILED: 'Failed to find meeting places. Please try again.',
    NO_VENUES_FOUND: 'No venues found near the midpoint.',
    NO_PLACES_FOUND: 'No places found near the midpoint. Try different categories or locations.',
    NO_PLACES_FOUND_GENERIC: 'No places found. Try different categories or locations.',
    API_KEY_INVALID: 'API key is invalid or expired. Please check your configuration.',
    API_QUOTA_EXCEEDED: 'API request limit exceeded. Please try again later.',
    NETWORK_ERROR: 'Network error. Please check your internet connection and try again.',
    DIRECTIONS_FAILED: 'Failed to calculate directions. Please try a different location or travel mode.',
    ROUTE_NOT_FOUND: 'No route found between locations. Please try a different location or travel mode.',
} as const;

export const INFO_MESSAGES = {
    DETECTING_LOCATION: 'Detecting location...',
    GETTING_LOCATION: 'Getting your location...',
    LOADING_DETAILS: 'Loading details...',
} as const;

export type ErrorMessageKey = keyof typeof ERROR_MESSAGES;
export type InfoMessageKey = keyof typeof INFO_MESSAGES;
