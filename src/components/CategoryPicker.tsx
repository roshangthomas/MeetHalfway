import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PlaceCategory, PLACE_CATEGORY_LABELS, MIN_CATEGORIES, MAX_CATEGORIES } from '../types';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../constants';

interface CategoryPickerProps {
    selectedCategories: PlaceCategory[];
    onCategoriesChange: (categories: PlaceCategory[]) => void;
}

const CATEGORY_ICONS: Record<PlaceCategory, keyof typeof Ionicons.glyphMap> = {
    restaurant: 'restaurant-outline',
    cafe: 'cafe-outline',
    park: 'leaf-outline',
    bar: 'wine-outline',
    shopping_mall: 'bag-outline',
    movie_theater: 'film-outline',
};

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
            <Text style={styles.label}>I'm looking for...</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {categories.map((category) => {
                    const isSelected = selectedCategories.includes(category);
                    const isDisabled = selectedCategories.length >= MAX_CATEGORIES && !isSelected;
                    const iconName = CATEGORY_ICONS[category];
                    return (
                        <TouchableOpacity
                            key={category}
                            style={[
                                styles.chip,
                                isSelected && styles.selectedChip,
                                isDisabled && styles.disabledChip,
                            ]}
                            onPress={() => handleToggleCategory(category)}
                            disabled={isDisabled}
                        >
                            <Ionicons
                                name={isSelected ? iconName.replace('-outline', '') as keyof typeof Ionicons.glyphMap : iconName}
                                size={16}
                                color={isSelected ? COLORS.SURFACE : isDisabled ? COLORS.TEXT_SECONDARY : COLORS.TEXT}
                            />
                            <Text
                                style={[
                                    styles.chipText,
                                    isSelected && styles.selectedChipText,
                                    isDisabled && styles.disabledChipText,
                                ]}
                            >
                                {PLACE_CATEGORY_LABELS[category]}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 10,
    },
    label: {
        fontSize: FONT_SIZES.MEDIUM,
        fontWeight: '600',
        color: COLORS.TEXT,
        marginBottom: SPACING.SMALL,
        marginHorizontal: SPACING.XS,
    },
    scrollContent: {
        paddingHorizontal: 2,
        gap: SPACING.SMALL,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.SURFACE,
        paddingVertical: SPACING.SMALL,
        paddingHorizontal: 12,
        borderRadius: 20,
        gap: 6,
        ...SHADOWS.SMALL,
    },
    selectedChip: {
        backgroundColor: COLORS.PRIMARY,
    },
    disabledChip: {
        opacity: 0.5,
    },
    chipText: {
        fontSize: 13,
        color: COLORS.TEXT,
    },
    selectedChipText: {
        color: COLORS.SURFACE,
        fontWeight: '600',
    },
    disabledChipText: {
        color: COLORS.TEXT_SECONDARY,
    },
});
