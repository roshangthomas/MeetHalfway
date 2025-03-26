import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export const OfflineNotice: React.FC = () => {
    const [isConnected, setIsConnected] = useState<boolean>(true);

    useEffect(() => {
        // Subscribe to network state updates
        const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
            setIsConnected(state.isConnected ?? true);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    if (isConnected) {
        return null;
    }

    return (
        <View style={styles.offlineContainer}>
            <Text style={styles.offlineText}>No Internet Connection</Text>
            <Text style={styles.offlineSubtext}>Please check your WiFi or cellular connection</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    offlineContainer: {
        backgroundColor: '#b52424',
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        width: '100%',
    },
    offlineText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    offlineSubtext: {
        color: '#fff',
        fontSize: 12,
        marginTop: 2,
    },
}); 