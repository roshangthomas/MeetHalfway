export interface Location {
    latitude: number;
    longitude: number;
}

export interface Participant {
    name: string;
    address: string;
    placeId?: string | null;
    location: Location | null;
}

export interface Restaurant {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    rating?: number;
    address?: string;
    distance?: string;
    duration?: string;
    photoUrl?: string;
    photoUrls?: string[];
    totalRatings?: number;
    priceLevel?: number;
    types?: string[];
    travelTimes?: number[];
    distances?: string[];
    durations?: string[];
    maxTimeDifference?: number;
    totalTravelTime?: number;
    fairnessScore?: number;
    score?: number;
    phoneNumber?: string;
    businessHours?: string[];
    editorialSummary?: string;
}

export type TravelMode = 'driving' | 'walking' | 'transit' | 'bicycling';

export type PlaceCategory = 'restaurant' | 'cafe' | 'park' | 'bar' | 'shopping_mall' | 'movie_theater';

export const PLACE_CATEGORY_LABELS: Record<PlaceCategory, string> = {
    restaurant: 'Restaurants',
    cafe: 'Coffee Shops',
    park: 'Parks',
    bar: 'Bars',
    shopping_mall: 'Shopping',
    movie_theater: 'Movies'
};

// Add minimum selection constant
export const MIN_CATEGORIES = 1;
export const MAX_CATEGORIES = Object.keys(PLACE_CATEGORY_LABELS).length;

export type SortOption = 'distance' | 'rating' | 'price' | 'travelTimeDiff';

export type RootStackParamList = {
    Home: {
        newLocation?: Location;
        newAddress?: string;
    } | undefined;
    Results: {
        restaurants: Restaurant[];
        participants: Participant[];
        midpointLocation: Location;
        travelMode: TravelMode;
    };
    RestaurantDetail: {
        restaurant: Restaurant;
        participants: Participant[];
        travelMode: TravelMode;
    };
    NoResults: {
        errorMessage?: string;
    };
    ChangeLocation: {
        previousLocation: Location | null;
        previousAddress: string;
        permissionDenied?: boolean;
    };
    LocationPermission: undefined;
}; 