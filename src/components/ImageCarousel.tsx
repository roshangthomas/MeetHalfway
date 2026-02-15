import React, { useState, useCallback } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Dimensions,
    NativeSyntheticEvent,
    NativeScrollEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS } from '../constants';

const placeholderImage = require('../../assets/placeholder-restaurant.png');

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_HORIZONTAL_MARGIN = 16;

interface ImageCarouselProps {
    photoUrls?: string[];
    photoUrl?: string;
    height?: number;
    width?: number;
    isSaved: boolean;
    onToggleSave: () => void;
    showHeart?: boolean;
}

export const ImageCarousel = React.memo<ImageCarouselProps>(({
    photoUrls,
    photoUrl,
    height = 220,
    width,
    isSaved,
    onToggleSave,
    showHeart = true,
}) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const imageWidth = width ?? SCREEN_WIDTH - CARD_HORIZONTAL_MARGIN * 2;

    const images = photoUrls && photoUrls.length > 0
        ? photoUrls
        : photoUrl
            ? [photoUrl]
            : [];

    const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const index = Math.round(e.nativeEvent.contentOffset.x / imageWidth);
        setActiveIndex(index);
    }, [imageWidth]);

    return (
        <View style={[styles.imageContainer, { height }]}>
            {images.length > 0 ? (
                <FlatList
                    data={images}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={handleScroll}
                    keyExtractor={(_, i) => i.toString()}
                    renderItem={({ item }) => (
                        <Image
                            source={{ uri: item }}
                            style={{ width: imageWidth, height }}
                            contentFit="cover"
                            transition={200}
                            cachePolicy="disk"
                        />
                    )}
                />
            ) : (
                <Image
                    source={placeholderImage}
                    style={{ width: imageWidth, height }}
                    contentFit="cover"
                    transition={200}
                />
            )}

            {/* Dot indicators */}
            {images.length > 1 && (
                <View style={styles.dotsContainer}>
                    {images.map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.dot,
                                i === activeIndex && styles.dotActive,
                            ]}
                        />
                    ))}
                </View>
            )}

            {/* Heart / Bookmark */}
            {showHeart && (
                <TouchableOpacity
                    style={styles.heartButton}
                    onPress={onToggleSave}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <FontAwesome
                        name={isSaved ? 'heart' : 'heart-o'}
                        size={20}
                        color={isSaved ? '#FF385C' : COLORS.SURFACE}
                    />
                </TouchableOpacity>
            )}
        </View>
    );
});

ImageCarousel.displayName = 'ImageCarousel';

const styles = StyleSheet.create({
    imageContainer: {
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: COLORS.GRAY_LIGHT,
    },
    dotsContainer: {
        position: 'absolute',
        bottom: 10,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 5,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
    dotActive: {
        backgroundColor: COLORS.SURFACE,
        width: 7,
        height: 7,
        borderRadius: 3.5,
    },
    heartButton: {
        position: 'absolute',
        top: 12,
        left: 12,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
