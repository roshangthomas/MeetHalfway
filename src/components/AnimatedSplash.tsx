import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import LottieView from 'lottie-react-native';
import { COLORS } from '../constants/colors';

interface AnimatedSplashProps {
    message?: string;
    onAnimationFinish?: () => void;
    duration?: number;
}

export const AnimatedSplash: React.FC<AnimatedSplashProps> = ({
    message = 'Getting app ready...',
    onAnimationFinish,
    duration = 1000
}) => {
    const animationRef = useRef<LottieView>(null);

    useEffect(() => {
        // Start animation and set a timer to call onAnimationFinish after duration
        if (onAnimationFinish) {
            const timer = setTimeout(() => {
                onAnimationFinish();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [onAnimationFinish, duration]);

    // Optimize animation performance
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Whats Halfway</Text>
            <LottieView
                ref={animationRef}
                source={require('../assets/animations/car-loading.json')}
                autoPlay
                loop={false}
                style={styles.animation}
                speed={1.5} // Speed up animation
            />
            <Text style={styles.message}>{message}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.PRIMARY,
        marginBottom: 20,
    },
    animation: {
        width: 150,
        height: 150,
    },
    message: {
        marginTop: 20,
        fontSize: 16,
        color: COLORS.TEXT,
    },
}); 