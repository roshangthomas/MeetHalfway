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
    Dimensions,
    NativeSyntheticEvent,
    TextInputFocusEventData,
    findNodeHandle,
    UIManager,
} from 'react-native';
import { getPlacePredictions } from '../services/places';
import { COLORS } from '../constants/colors';

interface LocationInputProps {
    value: string | null;
    onChangeText: (text: string) => void;
    placeholder: string;
    onInputFocus?: () => void;
}

type Suggestion = {
    id: string;
    description: string;
};

export const LocationInput: React.FC<LocationInputProps> = ({
    value,
    onChangeText,
    placeholder,
    onInputFocus,
}) => {
    const [predictions, setPredictions] = useState<Array<{ description: string; place_id: string }>>([]);
    const [showPredictions, setShowPredictions] = useState(false);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [isFocused, setIsFocused] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, maxHeight: 200 });
    const inputRef = useRef<TextInput>(null);

    // Add ref to track selection state that persists across re-renders
    const selectionMadeRef = useRef(false);

    useEffect(() => {
        // Only fetch predictions if no selection was just made
        if (!selectionMadeRef.current) {
            const fetchPredictions = async () => {
                console.log('fetchPredictions called with value:', value);
                if (value && value.length > 2) {
                    console.log('Fetching predictions for:', value);
                    const results = await getPlacePredictions(value);
                    console.log('Prediction results:', results);
                    setPredictions(results.slice(0, 5)); // Limit to 5 results
                    setShowPredictions(true);
                    console.log('showPredictions set to:', true);
                } else {
                    console.log('Input too short or empty, clearing predictions');
                    setPredictions([]);
                    setShowPredictions(false);
                }
            };

            const debounceTimeout = setTimeout(fetchPredictions, 300);
            return () => clearTimeout(debounceTimeout);
        } else {
            // Reset the selection flag after handling the value change
            selectionMadeRef.current = false;
            console.log('Selection was just made, skipping prediction fetch');
        }
    }, [value]);

    useEffect(() => {
        if (value && !selectionMadeRef.current) {
            setSuggestions(predictions.map(p => ({ id: p.place_id, description: p.description })));
        } else {
            setSuggestions([]);
        }
    }, [predictions, value]);

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            'keyboardDidShow',
            (e) => {
                if (inputRef.current) {
                    const nodeHandle = findNodeHandle(inputRef.current);
                    if (nodeHandle) {
                        UIManager.measure(nodeHandle, (x, y, width, height, pageX, pageY) => {
                            const screenHeight = Dimensions.get('window').height;
                            const keyboardHeight = e.endCoordinates.height;
                            const inputBottom = pageY + height;
                            const availableSpace = screenHeight - inputBottom - keyboardHeight - 10;

                            setDropdownPosition({
                                top: height,
                                maxHeight: Math.min(200, availableSpace)
                            });
                        });
                    }
                }
            }
        );

        return () => {
            keyboardDidShowListener.remove();
        };
    }, []);

    const clearAllDropdowns = () => {
        // Mark that a selection was made to prevent re-showing suggestions
        selectionMadeRef.current = true;

        // Clear all dropdown-related states
        setShowPredictions(false);
        setPredictions([]);
        setSuggestions([]);
        setIsFocused(false);

        // Dismiss keyboard
        Keyboard.dismiss();
    };

    const handleSelectPrediction = (prediction: string) => {
        // Update the text field first
        onChangeText(prediction);

        // Then clear all dropdowns and dismiss keyboard
        clearAllDropdowns();
    };

    const handleSelectSuggestion = (suggestion: Suggestion) => {
        // Update the text field first
        onChangeText(suggestion.description);

        // Then clear all dropdowns and dismiss keyboard
        clearAllDropdowns();
    };

    const handleFocus = () => {
        setIsFocused(true);
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
                        // Reset selection flag when user types
                        selectionMadeRef.current = false;
                        onChangeText(text);
                    }}
                    placeholder={placeholder}
                    placeholderTextColor={COLORS.TEXT_SECONDARY}
                    onFocus={handleFocus}
                    onBlur={() => {
                        setTimeout(() => {
                            // Only clear focus state if no selection was made
                            if (!selectionMadeRef.current) {
                                setIsFocused(false);
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

            {isFocused && suggestions.length > 0 && !selectionMadeRef.current && (
                <View
                    style={[
                        styles.suggestionsContainer,
                        {
                            top: dropdownPosition.top,
                            maxHeight: dropdownPosition.maxHeight
                        }
                    ]}
                >
                    <ScrollView
                        keyboardShouldPersistTaps="handled"
                        style={styles.scrollView}
                        nestedScrollEnabled={true}
                    >
                        {suggestions.map((suggestion) => (
                            <TouchableOpacity
                                key={suggestion.id}
                                style={styles.suggestionItem}
                                onPress={() => handleSelectSuggestion(suggestion)}
                            >
                                <Text style={styles.suggestionText}>{suggestion.description}</Text>
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
    suggestionsContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
        zIndex: 2,
    },
    suggestionItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    suggestionText: {
        fontSize: 14,
    },
}); 