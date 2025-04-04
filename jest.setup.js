import 'react-native-gesture-handler/jestSetup';

// Mock Expo Location
jest.mock('expo-location', () => ({
    requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    getCurrentPositionAsync: jest.fn().mockResolvedValue({
        coords: {
            latitude: 37.7749,
            longitude: -122.4194,
            altitude: null,
            accuracy: 5,
            altitudeAccuracy: null,
            heading: null,
            speed: null
        },
        timestamp: 1631234567890
    }),
    hasServicesEnabledAsync: jest.fn().mockResolvedValue(true)
}));

// Mock react-native-maps
jest.mock('react-native-maps', () => {
    const React = require('react');
    const MapView = jest.fn().mockImplementation(({ children, ...props }) => {
        return React.createElement('MapView', props, children);
    });

    const Marker = jest.fn().mockImplementation(props => {
        return React.createElement('Marker', props);
    });

    MapView.Marker = Marker;
    return {
        __esModule: true,
        default: MapView,
        Marker
    };
});

// Mock navigation
jest.mock('@react-navigation/native', () => {
    const actualNav = jest.requireActual('@react-navigation/native');
    return {
        ...actualNav,
        useNavigation: () => ({
            navigate: jest.fn(),
            setParams: jest.fn(),
            goBack: jest.fn()
        }),
        useRoute: () => ({
            params: {}
        })
    };
});

// Mock Linking
jest.mock('react-native/Libraries/Linking/Linking', () => ({
    openURL: jest.fn(),
    openSettings: jest.fn(),
    canOpenURL: jest.fn().mockResolvedValue(true)
}));

// Mock UIManager
jest.mock('react-native', () => {
    const ReactNative = jest.requireActual('react-native');
    return {
        ...ReactNative,
        UIManager: {
            ...ReactNative.UIManager,
            measureInWindow: jest.fn((node, callback) => callback(0, 0, 100, 50))
        },
        findNodeHandle: jest.fn().mockReturnValue(1)
    };
});

// Silence the warning: Animated: `useNativeDriver` is not supported
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => ({
    __esModule: true,
    default: {
        extractNativeEvent: () => ({}),
        API: {},
        addListener: jest.fn(),
        removeListeners: jest.fn(),
    },
}));

// Mock services
jest.mock('./src/services/location', () => ({
    getCurrentLocation: jest.fn().mockResolvedValue({
        latitude: 37.7749,
        longitude: -122.4194
    }),
    geocodeAddress: jest.fn().mockImplementation(address => {
        if (!address || address === '') {
            return Promise.reject(new Error('Invalid address'));
        }
        return Promise.resolve({
            latitude: 34.0522,
            longitude: -118.2437
        });
    }),
    calculateMidpoint: jest.fn().mockReturnValue({
        latitude: 35.9136,
        longitude: -120.3316
    }),
    calculateRoadMidpoint: jest.fn().mockResolvedValue({
        latitude: 35.9136,
        longitude: -120.3316
    }),
    findOptimalMeetingPlaces: jest.fn().mockResolvedValue([
        {
            id: '1',
            name: 'Restaurant 1',
            latitude: 35.9136,
            longitude: -120.3316,
            rating: 4.5,
            photo: 'https://example.com/photo1.jpg',
            vicinity: '123 Test St',
            userTravelTime: '30 mins',
            partnerTravelTime: '25 mins',
            fairnessScore: 0.95
        },
        {
            id: '2',
            name: 'Restaurant 2',
            latitude: 35.9236,
            longitude: -120.3416,
            rating: 4.2,
            photo: 'https://example.com/photo2.jpg',
            vicinity: '456 Test Ave',
            userTravelTime: '35 mins',
            partnerTravelTime: '20 mins',
            fairnessScore: 0.85
        }
    ])
}));

jest.mock('./src/services/places', () => ({
    searchRestaurants: jest.fn().mockResolvedValue([
        {
            id: '1',
            name: 'Restaurant 1',
            latitude: 35.9136,
            longitude: -120.3316,
            rating: 4.5,
            photo: 'https://example.com/photo1.jpg',
            vicinity: '123 Test St'
        }
    ]),
    getTravelInfo: jest.fn().mockResolvedValue({
        distance: '30 km',
        duration: '30 mins'
    })
}));

global.console = {
    ...console,
    error: jest.fn(),
    warn: jest.fn()
}; 