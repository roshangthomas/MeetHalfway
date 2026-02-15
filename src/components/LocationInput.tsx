import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    View,
    TextInput,
    ScrollView,
    TouchableOpacity,
    Text,
    Platform,
    Keyboard,
} from 'react-native';
import { getPlacePredictions } from '../services/places';
import { COLORS, MAX_RESULTS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants';
import { logger, generateSessionToken } from '../utils';
import { useDebounce } from '../hooks/useDebounce';
import { PlacePrediction } from '../types/api';

interface LocationInputProps {
    value: string | null;
    onChangeText: (text: string) => void;
    onPlaceSelected?: (placeId: string, description: string) => void;
    placeholder: string;
    onInputFocus?: () => void;
    userLocation?: { latitude: number; longitude: number } | null;
}

export const LocationInput: React.FC<LocationInputProps> = ({
    value,
    onChangeText,
    onPlaceSelected,
    placeholder,
    onInputFocus,
    userLocation,
}) => {
    const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
    const [showPredictions, setShowPredictions] = useState(false);
    const inputRef = useRef<TextInput>(null);
    const selectionMadeRef = useRef(false);
    const sessionTokenRef = useRef(generateSessionToken());

    const debouncedValue = useDebounce(value, 300);

    useEffect(() => {
        if (selectionMadeRef.current) {
            selectionMadeRef.current = false;
            return;
        }

        let cancelled = false;

        const fetchPredictions = async () => {
            if (debouncedValue && debouncedValue.length > 2) {
                try {
                    const options: {
                        sessionToken: string;
                        location?: string;
                        radius?: number;
                    } = {
                        sessionToken: sessionTokenRef.current,
                    };
                    if (userLocation) {
                        options.location = `${userLocation.latitude},${userLocation.longitude}`;
                        options.radius = 50000;
                    }
                    const results = await getPlacePredictions(debouncedValue, options);
                    if (cancelled) return;
                    setPredictions(results.slice(0, MAX_RESULTS.PREDICTIONS));
                    setShowPredictions(true);
                } catch (error) {
                    if (cancelled) return;
                    logger.error('Failed to fetch place predictions:', error);
                    setPredictions([]);
                    setShowPredictions(false);
                }
            } else {
                setPredictions([]);
                setShowPredictions(false);
            }
        };

        fetchPredictions();

        return () => { cancelled = true; };
    }, [debouncedValue, userLocation]);

    const clearAllDropdowns = () => {
        selectionMadeRef.current = true;
        setShowPredictions(false);
        setPredictions([]);
        sessionTokenRef.current = generateSessionToken();
        Keyboard.dismiss();
    };

    const handleSelectPrediction = (prediction: PlacePrediction) => {
        onChangeText(prediction.description);
        onPlaceSelected?.(prediction.place_id, prediction.description);
        clearAllDropdowns();
    };

    const handleFocus = () => {
        if (onInputFocus) {
            onInputFocus();
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.inputWrapper}>
                <TextInput
                    ref={inputRef}
                    style={styles.input}
                    value={value || ''}
                    onChangeText={(text) => {
                        selectionMadeRef.current = false;
                        onChangeText(text);
                    }}
                    placeholder={placeholder}
                    placeholderTextColor={COLORS.TEXT_SECONDARY}
                    onFocus={handleFocus}
                    onBlur={() => {
                        setTimeout(() => {
                            if (!selectionMadeRef.current) {
                                setShowPredictions(false);
                            }
                        }, 100);
                    }}
                />
            </View>

            {showPredictions && predictions.length > 0 && !selectionMadeRef.current && (
                <View style={styles.predictionsContainer}>
                    <ScrollView
                        keyboardShouldPersistTaps="always"
                        style={styles.scrollView}
                        nestedScrollEnabled={true}
                    >
                        {predictions.map((prediction) => (
                            <TouchableOpacity
                                key={prediction.place_id}
                                style={styles.predictionItem}
                                onPress={() => handleSelectPrediction(prediction)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.predictionText}>
                                    {prediction.description}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        zIndex: 999,
        elevation: Platform.OS === 'android' ? 999 : 0,
        position: 'relative',
    },
    inputWrapper: {
        width: '100%',
        zIndex: 999,
        elevation: Platform.OS === 'android' ? 999 : 0,
    },
    input: {
        height: 50,
        backgroundColor: COLORS.BACKGROUND,
        borderRadius: BORDER_RADIUS.LARGE,
        paddingHorizontal: SPACING.MEDIUM,
        fontSize: 15,
        color: COLORS.TEXT,
    },
    predictionsContainer: {
        position: 'absolute',
        top: 54,
        left: 0,
        right: 0,
        backgroundColor: COLORS.SURFACE,
        borderRadius: BORDER_RADIUS.XL,
        maxHeight: 200,
        shadowColor: COLORS.TEXT,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: Platform.OS === 'android' ? 999 : 0,
        zIndex: 999,
        overflow: 'hidden',
    },
    scrollView: {
        maxHeight: 200,
    },
    predictionItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.BORDER_LIGHT,
    },
    predictionText: {
        fontSize: FONT_SIZES.MEDIUM,
        color: COLORS.TEXT,
    },
});
