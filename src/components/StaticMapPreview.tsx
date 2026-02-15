import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { GOOGLE_MAPS_API_KEY } from '@env';
import { Location } from '../types';
import { COLORS } from '../constants';
import { BORDER_RADIUS } from '../constants/spacing';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAP_HEIGHT = Math.round(SCREEN_HEIGHT * 0.18);
const MAP_WIDTH = Math.round(SCREEN_WIDTH);

interface StaticMapPreviewProps {
    location: Location;
    zoom?: number;
}

const buildStaticMapUrl = (location: Location, zoom: number): string => {
    const params = new URLSearchParams({
        center: `${location.latitude},${location.longitude}`,
        zoom: String(zoom),
        size: `${MAP_WIDTH * 2}x${MAP_HEIGHT * 2}`,
        scale: '2',
        maptype: 'roadmap',
        markers: `color:red|${location.latitude},${location.longitude}`,
        key: GOOGLE_MAPS_API_KEY,
    });
    return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
};

const StaticMapPreview: React.FC<StaticMapPreviewProps> = ({ location, zoom = 15 }) => {
    const uri = buildStaticMapUrl(location, zoom);

    return (
        <View style={styles.container}>
            <Image
                source={{ uri }}
                style={styles.image}
                contentFit="cover"
                cachePolicy="disk"
                transition={200}
                accessibilityLabel="Map showing your location"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: MAP_HEIGHT,
        width: '100%',
        borderBottomLeftRadius: BORDER_RADIUS.XXL,
        borderBottomRightRadius: BORDER_RADIUS.XXL,
        overflow: 'hidden',
        backgroundColor: COLORS.GRAY_LIGHT,
    },
    image: {
        width: '100%',
        height: '100%',
    },
});

export default React.memo(StaticMapPreview);
