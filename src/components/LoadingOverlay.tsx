import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions, Platform, Animated } from 'react-native';
import LottieView from 'lottie-react-native';
import { COLORS, SPACING, FONT_SIZES } from '../constants';

interface LoadingOverlayProps {
    visible: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ visible }) => {
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(opacity, {
            toValue: visible ? 1 : 0,
            duration: visible ? 200 : 150,
            useNativeDriver: true,
        }).start();
    }, [visible, opacity]);

    return (
        <Animated.View
            style={[styles.container, { opacity }]}
            pointerEvents={visible ? 'auto' : 'none'}
        >
            <LottieView
                source={require('../assets/animations/car-loading.json')}
                autoPlay
                loop
                style={styles.animation}
            />
            <Text style={styles.text}>Sit tight, finding some recs</Text>
        </Animated.View>
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
        marginTop: SPACING.LARGE,
        fontSize: FONT_SIZES.XL,
        color: COLORS.TEXT,
        fontWeight: '600',
    },
});
