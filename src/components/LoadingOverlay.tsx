import React from 'react';
import { StyleSheet, View, Text, Dimensions, Platform } from 'react-native';
import LottieView from 'lottie-react-native';
import { COLORS } from '../constants/colors';

interface LoadingOverlayProps {
    visible: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ visible }) => {
    if (!visible) return null;

    return (
        <View style={styles.container}>
            <LottieView
                source={require('../assets/animations/car-loading.json')}
                autoPlay
                loop
                style={styles.animation}
            />
            <Text style={styles.text}>Sit tight, finding some recs</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: COLORS.SURFACE,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        elevation: Platform.OS === 'android' ? 9999 : undefined,
    },
    animation: {
        width: 200,
        height: 200,
    },
    text: {
        marginTop: 20,
        fontSize: 18,
        color: COLORS.TEXT,
        fontWeight: '600',
    },
}); 