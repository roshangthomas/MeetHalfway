export interface Location {
    latitude: number;
    longitude: number;
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
    totalRatings?: number;
    priceLevel?: number;
    types?: string[];
    travelTimeA?: number;
    travelTimeB?: number;
    timeDifference?: number;
    totalTravelTime?: number;
    fairnessScore?: number;
    score?: number;
    distanceA?: string;
    durationA?: string;
    distanceB?: string;
    durationB?: string;
    phoneNumber?: string;
    businessHours?: string[];
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
        userLocation: Location;
        partnerLocation: Location;
        midpointLocation: Location;
        travelMode: TravelMode;
    };
    RestaurantDetail: {
        restaurant: Restaurant;
        userLocation: Location;
        partnerLocation: Location;
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