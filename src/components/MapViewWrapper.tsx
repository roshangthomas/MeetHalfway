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
                showsTraffic={false} // Disable traffic display
                showsIndoors={false} // Disable indoor maps
                showsIndoorLevelPicker={false} // Disable indoor level picker
                showsCompass={false} // Disable compass
                showsScale={false} // Disable scale
                rotateEnabled={false} // Disable rotation for better performance
                pitchEnabled={false} // Disable pitch (3D view) for better performance
                moveOnMarkerPress={false} // Prevent automatic movement when marker is pressed
                loadingEnabled={true} // Enable loading indicator
                loadingIndicatorColor={Platform.OS === 'android' ? '#1976D2' : '#007AFF'} // Set loading indicator color
                loadingBackgroundColor="rgba(255, 255, 255, 0.7)" // Set loading background color
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