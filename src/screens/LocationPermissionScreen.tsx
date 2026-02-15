import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
  Linking,
  Alert,
  StyleSheet,
  AppState,
  Keyboard,
  KeyboardAvoidingView,
  Dimensions
} from 'react-native';
import { LocationInput } from '../components/LocationInput';
import { styles } from '../styles/App.styles';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Location as LocationType } from '../types';
import { ERROR_MESSAGES, COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants';
import { Ionicons } from '@expo/vector-icons';
import { logger, resolveLocation } from '../utils';

type LocationPermissionScreenProps = NativeStackScreenProps<RootStackParamList, 'LocationPermission'>;

export function LocationPermissionScreen({ navigation }: LocationPermissionScreenProps) {
  const [userAddress, setUserAddress] = useState('');
  const [userPlaceId, setUserPlaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settingsOpened, setSettingsOpened] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputContainerRef = useRef<View>(null);

  useEffect(() => {
    if (settingsOpened) {
      const checkAppReturn = () => {
        setCurrentStep(2);
      };

      const subscription = AppState.addEventListener('change', (nextAppState: string) => {
        if (nextAppState === 'active' && settingsOpened) {
          checkAppReturn();
        }
      });

      return () => {
        subscription.remove();
      };
    }
  }, [settingsOpened]);

  const handleInputFocus = () => {
    setTimeout(() => {
      if (inputContainerRef.current) {
        inputContainerRef.current.measureInWindow((x, y, width, height) => {
          const screenHeight = Dimensions.get('window').height;
          const desiredPosition = screenHeight * 0.2;
          const scrollAmount = Math.max(0, y - desiredPosition);
          scrollViewRef.current?.scrollTo({ y: scrollAmount, animated: true });
        });
      }
    }, 100);
  };

  const openLocationSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
    setSettingsOpened(true);
  };

  const refreshApp = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

  const handleUserAddressSubmit = async () => {
    if (!userAddress.trim()) {
      setError('Please enter your location');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const geocodedLocation = await resolveLocation(userAddress, userPlaceId);

      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'Home',
            params: {
              newLocation: geocodedLocation,
              newAddress: userAddress
            }
          }
        ],
      });

    } catch (error) {
      logger.error('Failed to geocode user address:', error);
      setError(error instanceof Error ? error.message : ERROR_MESSAGES.GEOCODING_FAILED);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={localStyles.stepContainer}>
            <View style={localStyles.stepHeader}>
              <View style={localStyles.stepNumberContainer}>
                <Text style={localStyles.stepNumber}>1</Text>
              </View>
              <Text style={localStyles.stepTitle}>Enable Location Access</Text>
            </View>

            <TouchableOpacity
              style={localStyles.actionButton}
              onPress={openLocationSettings}
            >
              <Ionicons name="settings-outline" size={18} color={COLORS.SURFACE} />
              <Text style={localStyles.actionButtonText}>
                Open Location Settings
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={localStyles.textLink}
              onPress={() => setCurrentStep(2)}
            >
              <Text style={localStyles.textLinkText}>
                I've already enabled location
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 2:
        return (
          <View style={localStyles.stepContainer}>
            <View style={localStyles.stepHeader}>
              <View style={localStyles.stepNumberContainer}>
                <Text style={localStyles.stepNumber}>2</Text>
              </View>
              <Text style={localStyles.stepTitle}>Apply New Settings</Text>
            </View>

            <TouchableOpacity
              style={localStyles.actionButton}
              onPress={refreshApp}
            >
              <Ionicons name="refresh-outline" size={18} color={COLORS.SURFACE} />
              <Text style={localStyles.actionButtonText}>
                Refresh App
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={localStyles.textLink}
              onPress={() => setCurrentStep(1)}
            >
              <Text style={localStyles.textLinkText}>
                Go back
              </Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container}>
        <LoadingOverlay visible={loading} />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollViewContent}
          >
            <View style={[styles.content, localStyles.compactContent]}>
              <View style={localStyles.headerContainer}>
              <Ionicons name="location" size={32} color={COLORS.PRIMARY} />
              <Text style={localStyles.headerTitle}>Location Access</Text>
            </View>

            <Text style={localStyles.explanationText}>
              We need your location to find places that are halfway between you and your friend's location.
            </Text>

            {renderStepContent()}

            <View style={localStyles.divider}>
                <View style={localStyles.dividerLine} />
                <Text style={localStyles.dividerText}>OR</Text>
              <View style={localStyles.dividerLine} />
            </View>

            <View
                ref={inputContainerRef}
                style={[styles.inputContainer, localStyles.manualContainer]}
              >
                <Text style={localStyles.manualTitle}>Enter Location Manually</Text>

                <LocationInput
                  value={userAddress}
                  onChangeText={(text) => {
                    setUserAddress(text);
                    setUserPlaceId(null);
                  }}
                  onPlaceSelected={(placeId, description) => {
                    setUserPlaceId(placeId);
                    setUserAddress(description);
                  }}
                  placeholder="Enter your location..."
                  onInputFocus={handleInputFocus}
                />
                <TouchableOpacity
                  style={[
                    localStyles.actionButton,
                    (!userAddress || loading) && styles.buttonDisabled
                  ]}
                  onPress={handleUserAddressSubmit}
                  disabled={loading || !userAddress}
                >
                  <Ionicons name="send-outline" size={18} color={COLORS.SURFACE} />
                  <Text style={localStyles.actionButtonText}>
                    Submit Location
                  </Text>
              </TouchableOpacity>
            </View>

            {error && (
                <Text style={styles.error}>
                  {error}
                </Text>
            )}

            <View style={localStyles.extraBottomSpace} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ErrorBoundary>
  );
}

// Local styles for this screen
const localStyles = StyleSheet.create({
  compactContent: {
    paddingVertical: SPACING.SMALL,
    paddingHorizontal: SPACING.SMALL,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.MEDIUM,
    paddingTop: SPACING.SMALL,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.TEXT,
    marginLeft: SPACING.SMALL,
  },
  stepContainer: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: BORDER_RADIUS.LARGE,
    padding: SPACING.MEDIUM,
    marginBottom: SPACING.MEDIUM,
    shadowColor: COLORS.TEXT,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  stepNumberContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.SMALL,
  },
  stepNumber: {
    color: COLORS.SURFACE,
    fontWeight: '700',
    fontSize: FONT_SIZES.MEDIUM,
  },
  stepTitle: {
    fontSize: FONT_SIZES.LARGE,
    fontWeight: '600',
    color: COLORS.TEXT,
  },
  actionButton: {
    backgroundColor: COLORS.PRIMARY,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: SPACING.SMALL,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: COLORS.SURFACE,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
  helperText: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  textLink: {
    alignSelf: 'center',
    padding: 6,
  },
  textLinkText: {
    color: COLORS.PRIMARY,
    fontSize: 13,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  dividerText: {
    paddingHorizontal: 12,
    color: COLORS.GRAY,
    fontWeight: '600',
    fontSize: 13,
  },
  manualContainer: {
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  manualTitle: {
    fontSize: FONT_SIZES.LARGE,
    fontWeight: '600',
    color: COLORS.TEXT,
    marginBottom: SPACING.SMALL,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.MEDIUM,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: SPACING.MEDIUM,
  },
  explanationText: {
    fontSize: FONT_SIZES.MEDIUM,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: SPACING.MEDIUM,
    paddingHorizontal: SPACING.LARGE,
    lineHeight: 20,
  },
  extraBottomSpace: {
    height: 120,
  },
});
