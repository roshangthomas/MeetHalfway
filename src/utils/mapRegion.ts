import { Region } from 'react-native-maps';
import { MAP_DELTAS } from '../constants';
import { Location } from '../types';

export function createRegionFromLocation(location: Location): Region {
    return {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: MAP_DELTAS.LATITUDE,
        longitudeDelta: MAP_DELTAS.LONGITUDE,
    };
}
