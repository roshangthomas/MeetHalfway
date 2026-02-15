import React from 'react';
import { ActivityIndicator, StyleSheet, View, Platform } from 'react-native';
import { COLORS } from '../constants';

interface LoadingSpinnerProps {
    size?: 'small' | 'large';
    color?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'large',
    color = COLORS.PRIMARY
}) => {
    const androidSize = size === 'large' ? 'large' : 'small';

    return (
        <View style={styles.container}>
            <ActivityIndicator
                size={androidSize}
                color={color}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
}); 