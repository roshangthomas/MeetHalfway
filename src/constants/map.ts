export const MAP_DELTAS = {
    LATITUDE: 0.0922,
    LONGITUDE: 0.0421,
} as const;

export const MAP_CONFIG = {
    LATITUDE_DELTA: MAP_DELTAS.LATITUDE,
    LONGITUDE_DELTA: MAP_DELTAS.LONGITUDE,
    HEIGHT_RATIO: 0.4,
    DEFAULT_ZOOM: 15,
} as const;

export const SEARCH_RADIUS = {
    DEFAULT: 1500,
    EXPANDED: [500, 1500, 3000, 5000, 10000, 15000, 20000, 25000, 30000],
} as const;

export const MAX_RESULTS = {
    RESTAURANTS: 20,
    PREDICTIONS: 5,
    VENUES_FOR_MIDPOINT: 10,
} as const;

export const MAX_PARTICIPANTS = 5;

export const PARTICIPANT_COLORS = [
    '#4A80F0', // blue (user)
    '#7D67EE', // purple
    '#4CAF50', // green
    '#F5A623', // orange
    '#E91E63', // pink
] as const;
