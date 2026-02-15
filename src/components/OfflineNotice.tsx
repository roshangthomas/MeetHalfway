import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, SPACING } from '../constants';

export const OfflineNotice: React.FC = () => {
    const [isConnected, setIsConnected] = useState<boolean>(true);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
            setIsConnected(state.isConnected ?? true);
        });

        return () => unsubscribe();
    }, []);

    if (isConnected) {
        return null;
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top + SPACING.SMALL }]}>
            <FontAwesome name="wifi" size={16} color={COLORS.WHITE} />
            <View style={styles.textContainer}>
                <Text style={styles.title}>No Internet Connection</Text>
                <Text style={styles.subtitle}>Please check your WiFi or cellular connection</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.OFFLINE_BG,
        paddingBottom: SPACING.MEDIUM,
        paddingHorizontal: SPACING.LARGE,
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.MEDIUM,
        width: '100%',
    },
    textContainer: {
        flex: 1,
    },
    title: {
        color: COLORS.WHITE,
        fontSize: FONT_SIZES.MEDIUM,
        fontWeight: '700',
    },
    subtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: FONT_SIZES.SMALL,
        marginTop: 2,
    },
});
