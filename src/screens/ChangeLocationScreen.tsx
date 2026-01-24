import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Platform,
    KeyboardAvoidingView,
} from 'react-native';
import { LocationInput } from '../components/LocationInput';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { LoadingOverlay } from '../components/LoadingOverlay';
import {
    getCurrentLocation,
    geocodeAddress,
} from '../services/location';
import { Location, RootStackParamList } from '../types';
import { styles } from '../styles/App.styles';
import { ERROR_MESSAGES, COLORS } from '../constants';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ExpoLocation from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useLocationPermission } from '../hooks/useLocationPermission';
import { logger } from '../utils';

type ChangeLocationScreenProps = NativeStackScreenProps<RootStackParamList, 'ChangeLocation'>;

export const ChangeLocationScreen: React.FC<ChangeLocationScreenProps> = ({ navigation, route }) => {
    const [userAddress, setUserAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        permissionStatus,
        setPermissionStatus,
        checkPermission,
        promptForPreciseLocation,
        openSettings,
    } = useLocationPermission();

    const scrollViewRef = useRef<ScrollView>(null);
    const locationInputRef = useRef<View>(null);

    useEffect(() => {
        if (route.params?.permissionDenied) {
            setPermissionStatus('denied');
        }
    }, [route.params?.permissionDenied, setPermissionStatus]);

    useEffect(() => {
        const checkLocationServices = async () => {
            const enabled = await ExpoLocation.hasServicesEnabledAsync();
            if (!enabled) {
                setPermissionStatus('denied');
            }
        };

        checkLocationServices();
    }, [setPermissionStatus]);

    const handleLocationFocus = () => {
        setTimeout(() => {
            if (locationInputRef.current && scrollViewRef.current) {
                locationInputRef.current.measureInWindow((x, y, width, height) => {
                    const yOffset = y + 150;
                    scrollViewRef.current?.scrollTo({ y: yOffset, animated: true });
                });
            }
        }, 300);
    };

    const getUserLocation = async () => {
        setLoading(true);
        try {
            const status = await checkPermission();

            if (status === 'denied') {
                throw new Error(ERROR_MESSAGES.LOCATION_PERMISSION_DENIED);
            }

            const location = await getCurrentLocation();
            setError(null);

            navigation.navigate('Home', {
                newLocation: location,
                newAddress: "Current Location"
            });

        } catch (err) {
            logger.error('Failed to get user location:', err);
            if (err instanceof Error && err.message === ERROR_MESSAGES.LOCATION_PERMISSION_DENIED) {
                setPermissionStatus('denied');
            }
            setError(err instanceof Error ? err.message : ERROR_MESSAGES.USER_LOCATION_UNAVAILABLE);
        } finally {
            setLoading(false);
        }
    };

    const handleUserAddressSubmit = async () => {
        if (!userAddress.trim()) {
            setError('Please enter your location');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const geocodedLocation = await geocodeAddress(userAddress);

            navigation.navigate('Home', {
                newLocation: geocodedLocation,
                newAddress: userAddress
            });

        } catch (err) {
            logger.error('Failed to geocode user address:', err);
            setError(err instanceof Error ? err.message : ERROR_MESSAGES.GEOCODING_FAILED);
        } finally {
            setLoading(false);
        }
    };

    const handlePreciseLocationPrompt = () => {
        promptForPreciseLocation((location) => {
            navigation.navigate('Home', {
                newLocation: location,
                newAddress: "Current Location"
            });
        });
    };

    return (
        <ErrorBoundary>
            <SafeAreaView style={styles.container}>
                <LoadingOverlay visible={loading} />
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardAvoidingContainer}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
                >
                    <ScrollView
                        ref={scrollViewRef}
                        style={styles.scrollView}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={styles.scrollViewContent}
                    >
                        <View style={styles.content}>
                            {permissionStatus === 'limited' && Platform.OS === 'android' && (
                                <TouchableOpacity
                                    style={styles.warningBanner}
                                    onPress={handlePreciseLocationPrompt}
                                >
                                    <Ionicons name="warning-outline" size={18} color={COLORS.PRIMARY} />
                                    <Text style={styles.warningText}>
                                        {ERROR_MESSAGES.LOCATION_PRECISION_LIMITED}
                                    </Text>
                                    <Ionicons name="chevron-forward" size={16} color={COLORS.PRIMARY} />
                                </TouchableOpacity>
                            )}

                            <View style={styles.inputContainer}>
                                {permissionStatus === 'denied' && (
                                    <View style={styles.permissionMessageContainer}>
                                        <Text style={styles.permissionTitle}>Location Access Required</Text>
                                        <Text style={styles.permissionText}>
                                            To use your current location, please enable location permissions for this app.
                                        </Text>
                                        <TouchableOpacity
                                            style={[styles.button, styles.warningButton]}
                                            onPress={openSettings}
                                        >
                                            <Text style={styles.buttonText}>
                                                Open Location Settings
                                            </Text>
                                        </TouchableOpacity>
                                        <Text style={styles.permissionText}>
                                            Alternatively, you can manually enter your location below.
                                        </Text>
                                    </View>
                                )}

                                <Text style={styles.label}>Your Location:</Text>
                                <View ref={locationInputRef}>
                                    <LocationInput
                                        value={userAddress}
                                        onChangeText={setUserAddress}
                                        placeholder="Enter your location..."
                                        onInputFocus={handleLocationFocus}
                                    />
                                </View>
                                <TouchableOpacity
                                    style={[
                                        styles.button,
                                        (!userAddress || loading) && styles.buttonDisabled
                                    ]}
                                    onPress={handleUserAddressSubmit}
                                    disabled={loading || !userAddress}
                                >
                                    <Text style={styles.buttonText}>
                                        Set My Location
                                    </Text>
                                </TouchableOpacity>

                                {permissionStatus !== 'denied' && (
                                    <TouchableOpacity
                                        style={[styles.button, styles.secondaryButton]}
                                        onPress={getUserLocation}
                                    >
                                        <Text style={styles.secondaryButtonText}>
                                            Use My Current Location
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {error && (
                                <Text style={styles.error}>
                                    {error}
                                </Text>
                            )}
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </ErrorBoundary>
    );
};

