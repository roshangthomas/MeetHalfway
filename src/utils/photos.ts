import { GOOGLE_MAPS_API_KEY } from '@env';

export function buildPhotoUrl(photoReference: string, maxWidth: number = 400): string {
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${GOOGLE_MAPS_API_KEY}`;
}
