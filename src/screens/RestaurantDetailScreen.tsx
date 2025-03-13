import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, SafeAreaView, Platform, Share } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { Restaurant, Location, TravelMode } from '../types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { PlaceImage } from '../components/PlaceImage';

type RestaurantDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'RestaurantDetail'>;

export const RestaurantDetailScreen: React.FC<RestaurantDetailScreenProps> = ({ route, navigation }) => {
    const { restaurant, userLocation, travelMode = 'driving' } = route.params;

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
                        size={18}
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

    const getDirections = () => {
        const destination = `${restaurant.latitude},${restaurant.longitude}`;

        const url = Platform.select({
            ios: `maps://app?saddr=${userLocation.latitude},${userLocation.longitude}&daddr=${destination}&dirflg=${getAppleMapsDirectionFlag(travelMode)}`,
            android: `google.navigation:q=${destination}&mode=${travelMode}`
        });

        if (url) {
            Linking.openURL(url).catch(err =>
                console.error('An error occurred while opening maps', err)
            );
        }
    };

    const getAppleMapsDirectionFlag = (mode: TravelMode): string => {
        switch (mode) {
            case 'walking':
                return 'w';
            case 'transit':
                return 'r';
            case 'bicycling':
                return 'b';
            case 'driving':
            default:
                return 'd';
        }
    };

    const shareLocation = async () => {
        try {
            const restaurantLocation = `${restaurant.latitude},${restaurant.longitude}`;
            const mapsUrl = Platform.select({
                ios: `https://maps.apple.com/?q=${restaurant.name}&ll=${restaurantLocation}`,
                android: `https://www.google.com/maps/search/?api=1&query=${restaurantLocation}&query_place_id=${restaurant.id}`
            });

            await Share.share({
                message: `Check out ${restaurant.name} at ${restaurant.address || 'this location'}. ${mapsUrl}`,
                url: mapsUrl, // iOS only
                title: `${restaurant.name} Location` // Android only
            });
        } catch (error) {
            console.error('Error sharing location:', error);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.heroImageContainer}>
                    <PlaceImage
                        photoUrl={restaurant.photoUrl}
                        types={restaurant.types}
                        style={styles.heroImage}
                    />
                </View>

                <View style={styles.content}>
                    <Text style={styles.name}>{restaurant.name}</Text>

                    <View style={styles.ratingRow}>
                        {renderRatingStars(restaurant.rating)}
                        {renderPriceLevel(restaurant.priceLevel)}
                    </View>

                    {restaurant.types && (
                        <View style={styles.tagsContainer}>
                            {restaurant.types.slice(0, 3).map((type, index) => (
                                <View key={index} style={styles.tag}>
                                    <Text style={styles.tagText}>
                                        {type.replace(/_/g, ' ')}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Location</Text>
                        {restaurant.address && (
                            <Text style={styles.address}>{restaurant.address}</Text>
                        )}

                        <View style={styles.travelInfo}>
                            {restaurant.distance && (
                                <Text style={styles.travelDetail}>
                                    <FontAwesome name="map-marker" size={16} color={COLORS.PRIMARY} />
                                    {' ' + restaurant.distance}
                                </Text>
                            )}
                            {restaurant.duration && (
                                <Text style={styles.travelDetail}>
                                    <FontAwesome name="clock-o" size={16} color={COLORS.PRIMARY} />
                                    {' ' + restaurant.duration}
                                </Text>
                            )}
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.shareButton}
                        onPress={shareLocation}
                    >
                        <FontAwesome name="share-alt" size={18} color={COLORS.SURFACE} />
                        <Text style={styles.buttonText}>Share Location</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.directionsButton}
                        onPress={getDirections}
                    >
                        <FontAwesome name="map" size={18} color={COLORS.SURFACE} />
                        <Text style={styles.buttonText}>Get Directions</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.BACKGROUND,
    },
    scrollView: {
        flex: 1,
    },
    heroImageContainer: {
        width: '100%',
        height: 250,
    },
    heroImage: {
        width: '100%',
        height: '100%',
        backgroundColor: COLORS.GRAY_LIGHT,
    },
    content: {
        padding: 20,
    },
    name: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.TEXT,
        marginBottom: 8,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    star: {
        marginRight: 3,
    },
    ratingCount: {
        fontSize: 16,
        color: COLORS.TEXT_SECONDARY,
        marginLeft: 6,
    },
    priceLevel: {
        fontSize: 16,
        color: COLORS.TEXT,
        fontWeight: '500',
    },
    priceLevelGray: {
        color: COLORS.GRAY_LIGHT,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
        gap: 8,
    },
    tag: {
        backgroundColor: COLORS.PRIMARY_LIGHT,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    tagText: {
        color: COLORS.PRIMARY,
        fontSize: 14,
        textTransform: 'capitalize',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.TEXT,
        marginBottom: 8,
    },
    address: {
        fontSize: 16,
        color: COLORS.TEXT_SECONDARY,
        marginBottom: 12,
        lineHeight: 22,
    },
    travelInfo: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        gap: 24,
    },
    travelDetail: {
        fontSize: 16,
        color: COLORS.TEXT_SECONDARY,
    },
    directionsButton: {
        backgroundColor: COLORS.PRIMARY,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 10,
    },
    shareButton: {
        backgroundColor: COLORS.SECONDARY,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 10,
        marginBottom: 12,
    },
    buttonText: {
        color: COLORS.SURFACE,
        fontSize: 16,
        fontWeight: '600',
    },
}); 