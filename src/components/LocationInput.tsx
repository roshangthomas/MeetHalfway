import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    TextInput,
    ScrollView,
    TouchableOpacity,
    Text,
    Platform,
} from 'react-native';
import { getPlacePredictions } from '../services/places';
import { COLORS } from '../constants/colors';

interface LocationInputProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
}

export const LocationInput: React.FC<LocationInputProps> = ({
    value,
    onChangeText,
    placeholder,
}) => {
    const [predictions, setPredictions] = useState<Array<{ description: string; place_id: string }>>([]);
    const [showPredictions, setShowPredictions] = useState(false);

    useEffect(() => {
        const fetchPredictions = async () => {
            if (value.length > 2) {
                const results = await getPlacePredictions(value);
                setPredictions(results.slice(0, 5)); // Limit to 5 results
                setShowPredictions(true);
            } else {
                setPredictions([]);
                setShowPredictions(false);
            }
        };

        const debounceTimeout = setTimeout(fetchPredictions, 300);
        return () => clearTimeout(debounceTimeout);
    }, [value]);

    const handleSelectPrediction = (prediction: string) => {
        // Add a small delay to ensure the touch event completes properly
        requestAnimationFrame(() => {
            onChangeText(prediction);
            setShowPredictions(false);
        });
    };

    return (
        <View style={styles.container}>
            <View style={styles.inputWrapper}>
                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={COLORS.TEXT_SECONDARY}
                />
            </View>

            {showPredictions && predictions.length > 0 && (
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
                                onPress={() => handleSelectPrediction(prediction.description)}
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
        backgroundColor: COLORS.SURFACE,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        color: COLORS.TEXT,
        shadowColor: COLORS.TEXT,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    predictionsContainer: {
        position: 'absolute',
        top: 55,
        left: 0,
        right: 0,
        backgroundColor: COLORS.SURFACE,
        borderRadius: 12,
        maxHeight: 200,
        shadowColor: COLORS.TEXT,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: Platform.OS === 'android' ? 999 : 0,
        zIndex: 999,
    },
    scrollView: {
        maxHeight: 200,
    },
    predictionItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    predictionText: {
        fontSize: 14,
        color: COLORS.TEXT,
    },
}); 