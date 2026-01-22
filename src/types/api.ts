export interface GoogleGeocodingResponse {
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

export interface GoogleDirectionsResponse {
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

export interface GooglePlacesResponse {
    results: GooglePlaceResult[];
    status: string;
}

export interface GooglePlaceResult {
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
}

export interface GooglePlacesAutocompleteResponse {
    predictions: PlacePrediction[];
    status: string;
}

export interface PlacePrediction {
    description: string;
    place_id: string;
}

export interface GooglePlaceDetailsResponse {
    result: {
        formatted_phone_number?: string;
        opening_hours?: {
            weekday_text?: string[];
        };
    };
    status: string;
}

export interface TravelInfo {
    distance: string;
    duration: string;
}

