import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform, Linking, Alert } from 'react-native';
import { COLORS } from '../constants/colors';
import { ERROR_MESSAGES } from '../constants';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

type LocationPermissionDeniedScreenProps = NativeStackScreenProps<RootStackParamList, 'LocationPermissionDenied'>;

export const LocationPermissionDeniedScreen: React.FC<LocationPermissionDeniedScreenProps> = ({ navigation }) => {
    // Function to open device settings
    const openLocationSettings = () => {
        // For iOS this opens the Settings app
        // For Android this opens Location Settings
        if (Platform.OS === 'ios') {
            Linking.openURL('app-settings:');
        } else {
            Linking.openSettings();
        }
    };

    // Navigate to ChangeLocation screen to manually enter location
    const handleManualLocationEntry = () => {
        navigation.navigate('ChangeLocation', {
            previousLocation: null,
            previousAddress: ''
        });
    };

    // Check if location permission has been granted
    const checkLocationPermission = async () => {
        try {
            // Request permission
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status === 'granted') {
                // Permission granted, get current location
                const location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced
                });

                // Navigate to Home with the location data
                navigation.navigate('Home', {
                    newLocation: {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                    },
                    newAddress: "Current Location"
                });
            } else {
                // Permission still not granted, show alert
                Alert.alert(
                    "Location Not Enabled",
                    "Please enable location services to use the app's full features.",
                    [{ text: "OK", style: "default" }]
                );
            }
        } catch (error) {
            console.error('Error checking location permission:', error);
            Alert.alert(
                "Error",
                "There was an error checking your location. Please try again.",
                [{ text: "OK", style: "default" }]
            );
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.errorContainer}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="location" size={60} color={COLORS.ERROR} />
                    </View>
                    <Text style={styles.errorTitle}>Location Needed</Text>
                    <Text style={styles.errorDescription}>
                        {ERROR_MESSAGES.LOCATION_PERMISSION_DENIED}
                    </Text>
                </View>

                <View style={styles.actionContainer}>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={openLocationSettings}
                    >
                        <Text style={styles.primaryButtonText}>
                            Enable Location Services
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.secondaryButton, styles.verifyButton]}
                        onPress={checkLocationPermission}
                    >
                        <Text style={styles.secondaryButtonText}>
                            I've Added Location
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.secondaryButton, styles.lastButton]}
                        onPress={handleManualLocationEntry}
                    >
                        <Text style={styles.secondaryButtonText}>
                            Set Location Manually
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.BACKGROUND,
    },
    content: {
        flex: 1,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.PRIMARY_LIGHT,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    errorTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.ERROR,
        marginBottom: 12,
        textAlign: 'center',
    },
    errorDescription: {
        fontSize: 16,
        color: COLORS.TEXT,
        textAlign: 'center',
        marginHorizontal: 24,
        lineHeight: 22,
    },
    actionContainer: {
        width: '100%',
        paddingHorizontal: 24,
    },
    primaryButton: {
        backgroundColor: COLORS.PRIMARY,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: COLORS.TEXT,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        color: COLORS.SURFACE,
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        backgroundColor: COLORS.SURFACE,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.PRIMARY,
    },
    secondaryButtonText: {
        color: COLORS.PRIMARY,
        fontSize: 16,
        fontWeight: '600',
    },
    verifyButton: {
        marginBottom: 16,
        backgroundColor: COLORS.SURFACE,
        borderColor: COLORS.SUCCESS,
    },
    lastButton: {
        marginBottom: 0,
    },
}); 