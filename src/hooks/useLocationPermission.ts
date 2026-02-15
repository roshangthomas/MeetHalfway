import { useState, useCallback, useRef } from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';
import { checkPreciseLocationPermission, getCurrentLocation, LocationPermissionStatus } from '../services/location';
import { openLocationSettings, logger } from '../utils';
import { Location } from '../types';

interface UseLocationPermissionReturn {
    permissionStatus: LocationPermissionStatus;
    setPermissionStatus: (status: LocationPermissionStatus) => void;
    checkPermission: () => Promise<LocationPermissionStatus>;
    promptForPreciseLocation: (onLocationUpdated?: (location: Location) => void) => void;
    openSettings: () => void;
}

export const useLocationPermission = (): UseLocationPermissionReturn => {
    const [permissionStatus, setPermissionStatus] = useState<LocationPermissionStatus>('pending');
    const appStateSubscriptionRef = useRef<ReturnType<typeof AppState.addEventListener> | null>(null);

    const checkPermission = useCallback(async (): Promise<LocationPermissionStatus> => {
        const status = await checkPreciseLocationPermission();
        setPermissionStatus(status);
        return status;
    }, []);

    const openSettings = useCallback(() => {
        openLocationSettings();
    }, []);

    const promptForPreciseLocation = useCallback((onLocationUpdated?: (location: Location) => void) => {
        Alert.alert(
            "Precise Location Needed",
            "For better accuracy, please enable precise location in your device settings.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Open Settings",
                    onPress: () => {
                        openLocationSettings();

                        if (appStateSubscriptionRef.current) {
                            appStateSubscriptionRef.current.remove();
                        }

                        appStateSubscriptionRef.current = AppState.addEventListener(
                            'change',
                            async (nextAppState: AppStateStatus) => {
                                if (nextAppState === 'active') {
                                    if (appStateSubscriptionRef.current) {
                                        appStateSubscriptionRef.current.remove();
                                        appStateSubscriptionRef.current = null;
                                    }

                                    const newPermissionStatus = await checkPreciseLocationPermission();
                                    setPermissionStatus(newPermissionStatus);

                                    if (newPermissionStatus === 'granted' && onLocationUpdated) {
                                        try {
                                            const location = await getCurrentLocation();
                                            onLocationUpdated(location);
                                        } catch (error) {
                                            logger.error('Failed to get updated location:', error);
                                        }
                                    }
                                }
                            }
                        );
                    }
                }
            ]
        );
    }, []);

    return {
        permissionStatus,
        setPermissionStatus,
        checkPermission,
        promptForPreciseLocation,
        openSettings,
    };
};

