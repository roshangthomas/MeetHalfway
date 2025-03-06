import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

interface RatingDisplayProps {
    rating?: number;
    totalRatings?: number;
    size?: number;
    showCount?: boolean;
}

export const RatingDisplay: React.FC<RatingDisplayProps> = ({
    rating,
    totalRatings,
    size = 16,
    showCount = true,
}) => {
    if (!rating) return null;

    return (
        <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
                <FontAwesome
                    key={star}
                    name={
                        star <= rating
                            ? 'star'
                            : star - 0.5 <= rating
                                ? 'star-half-o'
                                : 'star-o'
                    }
                    size={size}
                    color={COLORS.WARNING}
                    style={styles.star}
                />
            ))}
            {showCount && totalRatings && (
                <Text style={styles.ratingCount}>({totalRatings})</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    star: {
        marginRight: 2,
    },
    ratingCount: {
        fontSize: 14,
        color: COLORS.TEXT_SECONDARY,
        marginLeft: 4,
    },
}); 