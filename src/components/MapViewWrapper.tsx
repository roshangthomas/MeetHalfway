import React, { forwardRef } from 'react';
import MapView, { MapViewProps } from 'react-native-maps';
import { View } from 'react-native';

// Create a forwarded ref component for MapView with removeClippedSubviews={false}
// to prevent VirtualizedList nesting issues
const MapViewWrapper = forwardRef<MapView, MapViewProps>((props, ref) => {
    // The removeClippedSubviews={false} helps prevent the VirtualizedList nesting error
    // We wrap it in a View to further isolate it from ScrollView's VirtualizedList
    return (
        <View>
            <MapView
                {...props}
                ref={ref}
                removeClippedSubviews={false}
            />
        </View>
    );
});

// Add display name for debugging purposes
MapViewWrapper.displayName = 'MapViewWrapper';

export default MapViewWrapper; 