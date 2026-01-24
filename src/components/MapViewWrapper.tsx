import React, { forwardRef } from 'react';
import MapView, { MapViewProps } from 'react-native-maps';
import { View, Platform, StyleSheet } from 'react-native';

const MapViewWrapper = forwardRef<MapView, MapViewProps>((props, ref) => {
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