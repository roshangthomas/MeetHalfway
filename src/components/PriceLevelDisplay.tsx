import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { getPriceLevelDisplay } from '../utils';
import { COLORS } from '../constants';

interface PriceLevelDisplayProps {
    priceLevel?: number;
    fontSize?: number;
}

export const PriceLevelDisplay: React.FC<PriceLevelDisplayProps> = ({
    priceLevel,
    fontSize = 14,
}) => {
    const { filled, unfilled } = getPriceLevelDisplay(priceLevel);
    if (!filled) return null;

    return (
        <Text style={[styles.priceLevel, { fontSize }]}>
            {filled}
            <Text style={styles.priceLevelGray}>
                {unfilled}
            </Text>
        </Text>
    );
};

const styles = StyleSheet.create({
    priceLevel: {
        color: COLORS.TEXT,
    },
    priceLevelGray: {
        color: COLORS.GRAY_LIGHT,
    },
});
