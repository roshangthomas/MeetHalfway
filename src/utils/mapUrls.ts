import { Platform } from 'react-native';
import { Location, TravelMode } from '../types';

export function getAppleMapsDirectionFlag(mode: TravelMode): string {
    switch (mode) {
        case 'walking':
            return 'w';
        case 'transit':
            return 'r';
        case 'bicycling':
            return 'b';
        case 'driving':
        default:
            return 'd';
    }
}

export function getDirectionsUrl(
    origin: Location,
    destination: { latitude: number; longitude: number },
    travelMode: TravelMode,
    placeId?: string
): string {
    const destinationStr = `${destination.latitude},${destination.longitude}`;

    if (Platform.OS === 'ios') {
        const dirFlag = getAppleMapsDirectionFlag(travelMode);
        return `http://maps.apple.com/?saddr=${origin.latitude},${origin.longitude}&daddr=${destinationStr}&dirflg=${dirFlag}`;
    }

    let url = `https://www.google.com/maps/dir/?api=1&origin=${origin.latitude},${origin.longitude}&destination=${destinationStr}&travelmode=${travelMode}`;

    if (placeId) {
        url += `&destination_place_id=${placeId}`;
    }

    return url;
}

export function getShareUrl(
    name: string,
    location: { latitude: number; longitude: number },
    placeId?: string
): string {
    const locationStr = `${location.latitude},${location.longitude}`;

    if (Platform.OS === 'ios') {
        return `https://maps.apple.com/?q=${encodeURIComponent(name)}&ll=${locationStr}`;
    }

    let url = `https://www.google.com/maps/search/?api=1&query=${locationStr}`;
    if (placeId) {
        url += `&query_place_id=${placeId}`;
    }

    return url;
}

export function getShareMessage(
    name: string,
    address: string | undefined,
    mapsUrl: string
): string {
    return `Check out ${name} at ${address || 'this location'}. ${mapsUrl}`;
}
