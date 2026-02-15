import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS } from '../constants';

interface RatingDisplayProps {
    rating?: number;
    totalRatings?: number;
    size?: number;
    showCount?: boolean;
}

export const RatingDisplay: React.FC<RatingDisplayProps> = ({
    rating,
    totalRatings,
    size = 14,
    showCount = true,
}) => {
    if (!rating) return null;

    return (
        <View style={styles.ratingContainer}>
            <FontAwesome
                name="star"
                size={size}
                color={COLORS.TEXT}
            />
            <Text style={[styles.ratingNumber, { fontSize: size }]}>
                {rating.toFixed(1)}
            </Text>
            {showCount && totalRatings !== undefined && totalRatings > 0 && (
                <Text style={[styles.ratingCount, { fontSize: size - 1 }]}>
                    ({totalRatings})
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    ratingNumber: {
        fontWeight: '600',
        color: COLORS.TEXT,
    },
    ratingCount: {
        color: COLORS.TEXT_SECONDARY,
    },
});
