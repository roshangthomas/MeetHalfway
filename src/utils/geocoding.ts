import { Location } from '../types';
import { geocodeAddress } from '../services/location';
import { getPlaceDetailsForGeocoding } from '../services/places';

export async function resolveLocation(address: string, placeId?: string | null): Promise<Location> {
    if (placeId) {
        const details = await getPlaceDetailsForGeocoding(placeId);
        return { latitude: details.latitude, longitude: details.longitude };
    }
    return geocodeAddress(address);
}
