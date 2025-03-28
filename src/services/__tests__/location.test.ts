import {
    getCurrentLocation,
    geocodeAddress,
    calculateMidpoint,
    calculateRoadMidpoint,
    findOptimalMeetingPlaces
} from '../location';
import * as ExpoLocation from 'expo-location';
import { ERROR_MESSAGES } from '../../constants';

// Reset mocks before each test
beforeEach(() => {
    jest.clearAllMocks();
});

describe('Location Services', () => {
    describe('getCurrentLocation', () => {
        it('should get the current location when permission is granted', async () => {
            // Mock implementation for this specific test
            (ExpoLocation.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'granted' });
            (ExpoLocation.getCurrentPositionAsync as jest.Mock).mockResolvedValueOnce({
                coords: {
                    latitude: 37.7749,
                    longitude: -122.4194,
                }
            });

            const location = await getCurrentLocation();

            expect(ExpoLocation.requestForegroundPermissionsAsync).toHaveBeenCalled();
            expect(ExpoLocation.getCurrentPositionAsync).toHaveBeenCalled();
            expect(location).toEqual({
                latitude: 37.7749,
                longitude: -122.4194
            });
        });

        it('should throw an error when location permission is denied', async () => {
            // Mock permission denied
            (ExpoLocation.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'denied' });

            await expect(getCurrentLocation()).rejects.toThrow(ERROR_MESSAGES.LOCATION_PERMISSION_DENIED);
            expect(ExpoLocation.requestForegroundPermissionsAsync).toHaveBeenCalled();
            expect(ExpoLocation.getCurrentPositionAsync).not.toHaveBeenCalled();
        });

        it('should throw an error when getting location fails', async () => {
            // Mock permission granted but location retrieval fails
            (ExpoLocation.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'granted' });
            (ExpoLocation.getCurrentPositionAsync as jest.Mock).mockRejectedValueOnce(new Error('Location unavailable'));

            await expect(getCurrentLocation()).rejects.toThrow('Location unavailable');
            expect(ExpoLocation.requestForegroundPermissionsAsync).toHaveBeenCalled();
            expect(ExpoLocation.getCurrentPositionAsync).toHaveBeenCalled();
        });
    });

    describe('geocodeAddress', () => {
        it('should geocode a valid address', async () => {
            // Mock implementation already in the setup file
            const location = await geocodeAddress('San Francisco, CA');

            expect(location).toEqual({
                latitude: 34.0522,
                longitude: -118.2437
            });
        });

        it('should throw an error for an invalid address', async () => {
            await expect(geocodeAddress('')).rejects.toThrow('Invalid address');
        });
    });

    describe('calculateMidpoint', () => {
        it('should calculate the midpoint between two locations', () => {
            const location1 = { latitude: 37.7749, longitude: -122.4194 };
            const location2 = { latitude: 34.0522, longitude: -118.2437 };

            const midpoint = calculateMidpoint(location1, location2);

            // Using the mock implementation
            expect(midpoint).toEqual({
                latitude: 35.9136,
                longitude: -120.3316
            });
        });
    });

    describe('calculateRoadMidpoint', () => {
        it('should calculate the road-based midpoint between two locations', async () => {
            const location1 = { latitude: 37.7749, longitude: -122.4194 };
            const location2 = { latitude: 34.0522, longitude: -118.2437 };

            const midpoint = await calculateRoadMidpoint(location1, location2);

            // Using the mock implementation
            expect(midpoint).toEqual({
                latitude: 35.9136,
                longitude: -120.3316
            });
        });
    });

    describe('findOptimalMeetingPlaces', () => {
        it('should find optimal meeting places between two locations', async () => {
            const location1 = { latitude: 37.7749, longitude: -122.4194 };
            const location2 = { latitude: 34.0522, longitude: -118.2437 };

            const places = await findOptimalMeetingPlaces(
                location1,
                location2,
                'driving',
                ['restaurant'],
                10
            );

            expect(places).toHaveLength(2);
            expect(places[0]).toHaveProperty('id', '1');
            expect(places[0]).toHaveProperty('name', 'Restaurant 1');
            expect(places[0]).toHaveProperty('fairnessScore', 0.95);
        });
    });
}); 