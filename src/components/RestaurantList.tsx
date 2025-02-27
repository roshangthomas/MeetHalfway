import React from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    FlatList,
    Dimensions,
    Platform,
} from 'react-native';
import { Restaurant } from '../types';
import { COLORS } from '../constants/colors';
import { FontAwesome } from '@expo/vector-icons';

interface RestaurantListProps {
    restaurants: Restaurant[];
}

const RestaurantCard: React.FC<{ restaurant: Restaurant }> = ({ restaurant }) => {
    const renderRatingStars = (rating?: number) => {
        if (!rating) return null;

        return (
            <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <FontAwesome
                        key={star}
                        name={
                            star <= rating
                                ? 'star'
                                : star - 0.5 <= rating
                                    ? 'star-half-o'
                                    : 'star-o'
                        }
                        size={16}
                        color={COLORS.WARNING}
                        style={styles.star}
                    />
                ))}
                {restaurant.totalRatings && (
                    <Text style={styles.ratingCount}>({restaurant.totalRatings})</Text>
                )}
            </View>
        );
    };

    const renderPriceLevel = (priceLevel?: number) => {
        if (!priceLevel) return null;
        return (
            <Text style={styles.priceLevel}>
                {'$'.repeat(priceLevel)}
                <Text style={styles.priceLevelGray}>
                    {'$'.repeat(4 - priceLevel)}
                </Text>
            </Text>
        );
    };

    return (
        <View style={styles.card}>
            <Image
                source={
                    restaurant.photoUrl
                        ? { uri: restaurant.photoUrl }
                        : require('../../assets/placeholder-restaurant.png')
                }
                style={styles.image}
                resizeMode="cover"
            />
            <View style={styles.contentContainer}>
                <Text style={styles.name}>{restaurant.name}</Text>
                {restaurant.types && (
                    <Text style={styles.types}>
                        {restaurant.types.slice(0, 2).join(' • ')}
                    </Text>
                )}
                <View style={styles.ratingRow}>
                    {renderRatingStars(restaurant.rating)}
                    {renderPriceLevel(restaurant.priceLevel)}
                </View>
                {restaurant.address && (
                    <Text style={styles.address} numberOfLines={1}>
                        {restaurant.address}
                    </Text>
                )}
                <View style={styles.travelInfo}>
                    {restaurant.distance && (
                        <Text style={styles.travelDetail}>
                            <FontAwesome name="map-marker" size={14} color={COLORS.PRIMARY} />
                            {' ' + restaurant.distance}
                        </Text>
                    )}
                    {restaurant.duration && (
                        <Text style={styles.travelDetail}>
                            <FontAwesome name="clock-o" size={14} color={COLORS.PRIMARY} />
                            {' ' + restaurant.duration}
                        </Text>
                    )}
                </View>
            </View>
        </View>
    );
};

export const RestaurantList: React.FC<RestaurantListProps> = ({ restaurants }) => {
    return (
        <FlatList
            data={restaurants}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <RestaurantCard restaurant={item} />}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
        />
    );
};

const styles = StyleSheet.create({
    list: {
        padding: 8,
    },
    card: {
        backgroundColor: COLORS.SURFACE,
        borderRadius: 16,
        marginVertical: 8,
        marginHorizontal: 4,
        overflow: 'hidden',
        shadowColor: COLORS.TEXT,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    image: {
        width: '100%',
        height: 200,
        backgroundColor: COLORS.GRAY_LIGHT,
    },
    contentContainer: {
        padding: 16,
    },
    name: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.TEXT,
        marginBottom: 4,
    },
    types: {
        fontSize: 14,
        color: COLORS.TEXT_SECONDARY,
        marginBottom: 8,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    star: {
        marginRight: 2,
    },
    ratingCount: {
        fontSize: 14,
        color: COLORS.TEXT_SECONDARY,
        marginLeft: 4,
    },
    priceLevel: {
        fontSize: 14,
        color: COLORS.TEXT,
    },
    priceLevelGray: {
        color: COLORS.GRAY_LIGHT,
    },
    address: {
        fontSize: 14,
        color: COLORS.TEXT_SECONDARY,
        marginBottom: 8,
    },
    travelInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    travelDetail: {
        fontSize: 14,
        color: COLORS.TEXT_SECONDARY,
    },
}); 