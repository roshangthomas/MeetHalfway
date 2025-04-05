import React, { forwardRef } from 'react';
import MapView, { MapViewProps } from 'react-native-maps';
import { View, Platform, StyleSheet } from 'react-native';

// Create a forwarded ref component for MapView with removeClippedSubviews={false}
// to prevent VirtualizedList nesting issues
const MapViewWrapper = forwardRef<MapView, MapViewProps>((props, ref) => {
    // The removeClippedSubviews={false} helps prevent the VirtualizedList nesting error
    // We wrap it in a View to further isolate it from ScrollView's VirtualizedList
    return (
        <View style={styles.container}>
            <MapView
                {...props}
                ref={ref}
                removeClippedSubviews={false}
                liteMode={Platform.OS === 'android'} // Use lite mode on Android for better performance
                showsPointsOfInterest={false} // Disable POIs to reduce map complexity
                showsBuildings={false} // Disable 3D buildings to improve performance
                style={[styles.map, props.style]}
            />
        </View>
    );
});

// Add display name for debugging purposes
MapViewWrapper.displayName = 'MapViewWrapper';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    map: {
        flex: 1,
        width: '100%',
        height: '100%',
    }
});

export default MapViewWrapper; 