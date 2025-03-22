import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    Platform,
    TextInput,
    TouchableWithoutFeedback
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { COLORS } from '../constants/colors';

export interface FilterOptions {
    minRating: number;
    minReviews: number;
    maxPrice: number; // 1-4
}

interface FilterModalProps {
    visible: boolean;
    onClose: () => void;
    onApply: (filters: FilterOptions) => void;
    initialFilters: FilterOptions;
}

export const FilterModal: React.FC<FilterModalProps> = ({
    visible,
    onClose,
    onApply,
    initialFilters,
}) => {
    const [filters, setFilters] = useState<FilterOptions>(initialFilters);
    const [tempRating, setTempRating] = useState(initialFilters.minRating);
    const [tempPrice, setTempPrice] = useState(initialFilters.maxPrice);

    // Add refs to track if the user is currently sliding
    const ratingSliderActive = useRef(false);
    const priceSliderActive = useRef(false);

    // Synchronize state when initialFilters change
    useEffect(() => {
        setTempRating(initialFilters.minRating);
        setTempPrice(initialFilters.maxPrice);
        setFilters(initialFilters);
    }, [initialFilters]);

    const handleReset = () => {
        setFilters({
            minRating: 0,
            minReviews: 0,
            maxPrice: 4,
        });
        setTempRating(0);
        setTempPrice(4);
    };

    const renderStars = (count: number) => {
        return (
            <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map(star => (
                    <FontAwesome
                        key={star}
                        name={star <= count ? 'star' : 'star-o'}
                        size={20}
                        color={star <= count ? COLORS.WARNING : COLORS.GRAY_LIGHT}
                        style={styles.star}
                    />
                ))}
            </View>
        );
    };

    const renderPriceLevel = (level: number) => {
        return (
            <View style={styles.priceLevelContainer}>
                {[1, 2, 3, 4].map(price => (
                    <Text
                        key={price}
                        style={[
                            styles.priceSymbol,
                            { color: price <= level ? COLORS.TEXT : COLORS.GRAY_LIGHT }
                        ]}
                    >
                        $
                    </Text>
                ))}
            </View>
        );
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <SafeAreaView style={styles.modalContainer}>
                    <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Filter Restaurants</Text>
                                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                    <FontAwesome name="times" size={24} color={COLORS.TEXT} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.scrollView}>
                                {/* Rating Filter */}
                                <View style={styles.filterSection}>
                                    <Text style={styles.filterTitle}>Minimum Rating</Text>
                                    <View style={styles.sliderContainer}>
                                        {renderStars(tempRating)}
                                        {Platform.OS === 'android' ? (
                                            <Slider
                                                style={styles.slider}
                                                minimumValue={0}
                                                maximumValue={5}
                                                step={1}
                                                value={tempRating}
                                                onSlidingStart={() => {
                                                    ratingSliderActive.current = true;
                                                }}
                                                onValueChange={(value: number) => {
                                                    if (ratingSliderActive.current) {
                                                        setTempRating(value);
                                                    }
                                                }}
                                                onSlidingComplete={(value: number) => {
                                                    ratingSliderActive.current = false;
                                                    setTempRating(value);
                                                    setFilters(prev => ({ ...prev, minRating: value }));
                                                }}
                                                minimumTrackTintColor={COLORS.PRIMARY}
                                                maximumTrackTintColor={COLORS.GRAY_LIGHT}
                                                thumbTintColor={COLORS.PRIMARY}
                                            />
                                        ) : (
                                            <Slider
                                                style={styles.slider}
                                                minimumValue={0}
                                                maximumValue={5}
                                                step={1}
                                                value={tempRating}
                                                onValueChange={(value: number) => {
                                                    setTempRating(value);
                                                }}
                                                onSlidingComplete={(value: number) => {
                                                    setFilters(prev => ({ ...prev, minRating: value }));
                                                }}
                                                minimumTrackTintColor={COLORS.PRIMARY}
                                                maximumTrackTintColor={COLORS.GRAY_LIGHT}
                                                thumbTintColor={COLORS.PRIMARY}
                                            />
                                        )}
                                        <Text style={styles.sliderValue}>{tempRating} stars or more</Text>
                                    </View>
                                </View>

                                {/* Minimum Reviews Filter */}
                                <View style={styles.filterSection}>
                                    <Text style={styles.filterTitle}>Minimum Reviews</Text>
                                    <View style={styles.inputContainer}>
                                        <TextInput
                                            style={[
                                                styles.textInput,
                                                filters.minReviews < 0 && styles.textInputError
                                            ]}
                                            keyboardType="number-pad"
                                            value={filters.minReviews.toString() === "0" ? "" : filters.minReviews.toString()}
                                            onChangeText={(text) => {
                                                // Handle empty text case
                                                if (text === "") {
                                                    setFilters({ ...filters, minReviews: 0 });
                                                    return;
                                                }

                                                const value = parseInt(text);
                                                // Validate the input
                                                if (isNaN(value)) {
                                                    return;
                                                }

                                                // Check for negative values
                                                if (value < 0) {
                                                    setFilters({ ...filters, minReviews: -1 }); // Setting to -1 to indicate error
                                                } else {
                                                    setFilters({ ...filters, minReviews: value });
                                                }
                                            }}
                                            placeholder="0"
                                            placeholderTextColor={COLORS.GRAY_LIGHT}
                                        />
                                        <Text style={styles.inputLabel}>reviews or more</Text>
                                    </View>
                                    {filters.minReviews < 0 && (
                                        <Text style={styles.errorText}>Please enter a valid number (0 or greater)</Text>
                                    )}
                                </View>

                                {/* Price Level Filter */}
                                <View style={styles.filterSection}>
                                    <Text style={styles.filterTitle}>Maximum Price Level</Text>
                                    <View style={styles.sliderContainer}>
                                        {renderPriceLevel(tempPrice)}
                                        {Platform.OS === 'android' ? (
                                            <Slider
                                                style={styles.slider}
                                                minimumValue={1}
                                                maximumValue={4}
                                                step={1}
                                                value={tempPrice}
                                                onSlidingStart={() => {
                                                    priceSliderActive.current = true;
                                                }}
                                                onValueChange={(value: number) => {
                                                    if (priceSliderActive.current) {
                                                        setTempPrice(value);
                                                    }
                                                }}
                                                onSlidingComplete={(value: number) => {
                                                    priceSliderActive.current = false;
                                                    setTempPrice(value);
                                                    setFilters(prev => ({ ...prev, maxPrice: value }));
                                                }}
                                                minimumTrackTintColor={COLORS.PRIMARY}
                                                maximumTrackTintColor={COLORS.GRAY_LIGHT}
                                                thumbTintColor={COLORS.PRIMARY}
                                            />
                                        ) : (
                                            <Slider
                                                style={styles.slider}
                                                minimumValue={1}
                                                maximumValue={4}
                                                step={1}
                                                value={tempPrice}
                                                onValueChange={(value: number) => {
                                                    setTempPrice(value);
                                                }}
                                                onSlidingComplete={(value: number) => {
                                                    setFilters(prev => ({ ...prev, maxPrice: value }));
                                                }}
                                                minimumTrackTintColor={COLORS.PRIMARY}
                                                maximumTrackTintColor={COLORS.GRAY_LIGHT}
                                                thumbTintColor={COLORS.PRIMARY}
                                            />
                                        )}
                                    </View>
                                </View>

                            </ScrollView>

                            <View style={styles.buttonContainer}>
                                <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
                                    <Text style={styles.resetButtonText}>Reset</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.applyButton,
                                        filters.minReviews < 0 && styles.applyButtonDisabled
                                    ]}
                                    onPress={() => {
                                        // Don't apply if there are validation errors
                                        if (filters.minReviews < 0) {
                                            return;
                                        }
                                        onApply(filters);
                                    }}
                                >
                                    <Text style={styles.applyButtonText}>Apply Filters</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </SafeAreaView>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.BACKGROUND,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: Platform.OS === 'ios' ? 20 : 30,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.GRAY_LIGHT,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.TEXT,
    },
    closeButton: {
        padding: 5,
    },
    scrollView: {
        maxHeight: '70%',
    },
    filterSection: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.GRAY_LIGHT,
    },
    filterTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.TEXT,
        marginBottom: 15,
    },
    sliderContainer: {
        alignItems: 'center',
    },
    slider: {
        width: '100%',
        height: 40,
    },
    sliderValue: {
        fontSize: 16,
        color: COLORS.TEXT_SECONDARY,
        marginTop: 5,
    },
    starsContainer: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    star: {
        marginHorizontal: 2,
    },
    priceLevelContainer: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    priceSymbol: {
        fontSize: 20,
        fontWeight: '600',
        marginHorizontal: 5,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    textInput: {
        borderWidth: 1,
        borderColor: COLORS.GRAY_LIGHT,
        borderRadius: 8,
        padding: 10,
        width: 80,
        fontSize: 16,
        marginRight: 10,
    },
    inputLabel: {
        fontSize: 16,
        color: COLORS.TEXT_SECONDARY,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: COLORS.GRAY_LIGHT,
    },
    resetButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.PRIMARY,
        marginRight: 10,
    },
    resetButtonText: {
        color: COLORS.PRIMARY,
        fontSize: 16,
        fontWeight: '600',
    },
    applyButton: {
        flex: 1,
        backgroundColor: COLORS.PRIMARY,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
    },
    applyButtonText: {
        color: COLORS.SURFACE,
        fontSize: 16,
        fontWeight: '600',
    },
    textInputError: {
        borderColor: COLORS.ERROR || '#FF3B30',
    },
    errorText: {
        color: COLORS.ERROR || '#FF3B30',
        fontSize: 14,
        marginTop: 5,
    },
    applyButtonDisabled: {
        backgroundColor: COLORS.GRAY_LIGHT,
    },
}); 