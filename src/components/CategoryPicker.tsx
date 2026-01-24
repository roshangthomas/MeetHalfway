import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { PlaceCategory, PLACE_CATEGORY_LABELS, MIN_CATEGORIES, MAX_CATEGORIES } from '../types';
import { COLORS } from '../constants';

interface CategoryPickerProps {
    selectedCategories: PlaceCategory[];
    onCategoriesChange: (categories: PlaceCategory[]) => void;
}

export const CategoryPicker: React.FC<CategoryPickerProps> = ({
    selectedCategories,
    onCategoriesChange,
}) => {
    const categories = Object.keys(PLACE_CATEGORY_LABELS) as PlaceCategory[];

    const handleToggleCategory = (category: PlaceCategory) => {
        if (selectedCategories.includes(category)) {
            if (selectedCategories.length > MIN_CATEGORIES) {
                onCategoriesChange(selectedCategories.filter(c => c !== category));
            }
        } else {
            if (selectedCategories.length < MAX_CATEGORIES) {
                onCategoriesChange([...selectedCategories, category]);
            }
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Text style={styles.label}>I'm looking for...</Text>
                <Text style={styles.subtitle}>
                    Select up to {MAX_CATEGORIES} options
                </Text>
            </View>
            <View style={styles.categoryGrid}>
                {categories.map((category) => (
                    <View key={category} style={styles.categoryButton}>
                        <TouchableOpacity
                            style={[
                                styles.categoryButtonInner,
                                selectedCategories.includes(category) && styles.selectedCategory,
                                selectedCategories.length >= MAX_CATEGORIES &&
                                !selectedCategories.includes(category) &&
                                styles.disabledCategory,
                            ]}
                            onPress={() => handleToggleCategory(category)}
                            disabled={selectedCategories.length >= MAX_CATEGORIES && !selectedCategories.includes(category)}
                        >
                            <Text
                                style={[
                                    styles.categoryText,
                                    selectedCategories.includes(category) && styles.selectedCategoryText,
                                    selectedCategories.length >= MAX_CATEGORIES &&
                                    !selectedCategories.includes(category) &&
                                    styles.disabledCategoryText,
                                ]}
                            >
                                {PLACE_CATEGORY_LABELS[category]}
                            </Text>
                        </TouchableOpacity>
                    </View>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 10,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 8,
        marginHorizontal: 4,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.TEXT,
    },
    subtitle: {
        fontSize: 12,
        color: COLORS.TEXT_SECONDARY,
        fontStyle: 'italic',
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -2,
    },
    categoryButton: {
        width: '50%',
        paddingHorizontal: 2,
        paddingVertical: 2,
    },
    categoryButtonInner: {
        backgroundColor: COLORS.SURFACE,
        paddingVertical: 8,
        paddingHorizontal: 6,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.TEXT,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    selectedCategory: {
        backgroundColor: COLORS.PRIMARY,
    },
    disabledCategory: {
        opacity: 0.5,
    },
    categoryText: {
        fontSize: 13,
        color: COLORS.TEXT,
        textAlign: 'center',
    },
    selectedCategoryText: {
        color: COLORS.SURFACE,
        fontWeight: '600',
    },
    disabledCategoryText: {
        color: COLORS.TEXT_SECONDARY,
    },
}); 