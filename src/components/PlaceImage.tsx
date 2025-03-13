import React from 'react';
import { Image, StyleSheet, ImageSourcePropType, ImageStyle } from 'react-native';
import { getDefaultImageForPlaceType } from '../utils/imageUtils';

interface PlaceImageProps {
    photoUrl?: string;
    types?: string[];
    style?: ImageStyle;
}

export const PlaceImage: React.FC<PlaceImageProps> = ({ photoUrl, types, style }) => {
    // If there's a photo URL, use it
    if (photoUrl) {
        return <Image source={{ uri: photoUrl }} style={[styles.image, style]} />;
    }

    // Otherwise, use a default image based on place type
    const defaultImage = getDefaultImageForPlaceType(types);
    return <Image source={defaultImage} style={[styles.image, style]} />;
};

const styles = StyleSheet.create({
    image: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
        resizeMode: 'cover',
    },
}); 