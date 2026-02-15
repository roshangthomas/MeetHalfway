export const formatAddressForDisplay = (address: string | null): string => {
    if (!address) return 'Current Location';

    const parts = address.split(',').map(part => part.trim());

    if (parts.length >= 3) {
        return parts.slice(Math.max(0, parts.length - 3)).join(', ');
    }

    return address;
};

export const formatPlaceType = (type: string): string => {
    return type
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

// --- Extract city name from vicinity/address ---
// Nearby Search returns `vicinity` like "2 Orinda Theatre Square, Orinda"
// We want the last part (city), not the street address.
export const getShortLocation = (address?: string): string | null => {
    if (!address) return null;
    const parts = address.split(',').map(p => p.trim());
    if (parts.length >= 2) return parts[parts.length - 1];
    if (parts.length === 1) return parts[0];
    return null;
};

// --- Type display ---
// Types that are completely uninformative — always hidden
const HIDDEN_TYPES = new Set([
    'point_of_interest', 'establishment', 'food', 'store', 'place',
]);

// Friendly display names for common types
const TYPE_DISPLAY_NAMES: Record<string, string> = {
    meal_takeaway: 'Takeout',
    meal_delivery: 'Delivery',
    night_club: 'Night Club',
    shopping_mall: 'Shopping',
    movie_theater: 'Movie Theater',
};

const capitalize = (s: string): string =>
    s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

export const getSpecificType = (types?: string[]): string | null => {
    if (!types || types.length === 0) return null;
    // Find the first type that isn't completely hidden
    const useful = types.find(t => !HIDDEN_TYPES.has(t));
    if (!useful) return null;
    if (TYPE_DISPLAY_NAMES[useful]) return TYPE_DISPLAY_NAMES[useful];
    return capitalize(useful.replace(/_/g, ' '));
};

// --- Travel mode icon mapping ---
export const TRAVEL_MODE_ICONS = {
    walking: 'male',
    transit: 'bus',
    bicycling: 'bicycle',
    driving: 'car',
} as const;
