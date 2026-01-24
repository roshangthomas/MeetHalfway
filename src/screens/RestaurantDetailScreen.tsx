import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, SafeAreaView, Share, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { Restaurant, TravelMode } from '../types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { getPlaceDetails } from '../services/places';
import {
    logger,
    getPriceLevelDisplay,
    isBusinessOpen,
    getGoogleDayIndex,
    getDirectionsUrl,
    getShareUrl,
    getShareMessage,
} from '../utils';

// Placeholder image for restaurants without photos
const placeholderImage = require('../../assets/placeholder-restaurant.png');

type RestaurantDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'RestaurantDetail'>;

export const RestaurantDetailScreen: React.FC<RestaurantDetailScreenProps> = ({ route, navigation }) => {
    const { restaurant, userLocation, travelMode = 'driving' } = route.params;
    const [detailedRestaurant, setDetailedRestaurant] = useState<Restaurant>(restaurant);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPlaceDetails = async () => {
            try {
                setIsLoading(true);
                const details = await getPlaceDetails(restaurant.id);
                setDetailedRestaurant({
                    ...restaurant,
                    phoneNumber: details.phoneNumber,
                    businessHours: details.businessHours
                });
            } catch (error) {
                logger.error('Failed to fetch place details:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPlaceDetails();
    }, [restaurant.id]);

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
        const { filled, unfilled } = getPriceLevelDisplay(priceLevel);
        if (!filled) return null;
        return (
            <Text style={styles.priceLevel}>
                {filled}
                <Text style={styles.priceLevelGray}>
                    {unfilled}
                </Text>
            </Text>
        );
    };

    const handleGetDirections = () => {
        const url = getDirectionsUrl(
            userLocation,
            { latitude: restaurant.latitude, longitude: restaurant.longitude },
            travelMode,
            restaurant.id
        );

        logger.info(`Opening maps with URL: ${url}, travel mode: ${travelMode}`);
        Linking.openURL(url).catch(err =>
            logger.error('An error occurred while opening maps', err)
        );
    };

    const handleShareLocation = async () => {
        try {
            const mapsUrl = getShareUrl(
                restaurant.name,
                { latitude: restaurant.latitude, longitude: restaurant.longitude },
                restaurant.id
            );

            const message = getShareMessage(restaurant.name, restaurant.address, mapsUrl);

            await Share.share({
                message,
                url: mapsUrl, // iOS only
                title: `${restaurant.name} Location` // Android only
            });
        } catch (error) {
            logger.error('Error sharing location:', error);
        }
    };

    const callRestaurant = () => {
        if (detailedRestaurant.phoneNumber) {
            Linking.openURL(`tel:${detailedRestaurant.phoneNumber}`);
        }
    };

    const renderBusinessHours = () => {
        if (!detailedRestaurant.businessHours || detailedRestaurant.businessHours.length === 0) {
            return null;
        }

        const googleToday = getGoogleDayIndex(new Date().getDay());

        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Business Hours</Text>
                <View style={styles.hoursContainer}>
                    {detailedRestaurant.businessHours.map((hourString, index) => {
                        const [day, hours] = hourString.split(': ');
                        const isToday = index === googleToday;

                        return (
                            <View
                                key={index}
                                style={[
                                    styles.hourRow,
                                    isToday && styles.todayRow
                                ]}
                            >
                                <Text style={[
                                    styles.dayText,
                                    isToday && styles.todayText
                                ]}>
                                    {day}
                                </Text>
                                <Text style={[
                                    styles.timeText,
                                    isToday && styles.todayText
                                ]}>
                                    {hours}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            </View>
        );
    };

    const renderOpenStatusBadge = () => {
        const openStatus = isBusinessOpen(detailedRestaurant.businessHours);

        if (openStatus === null) {
            return null;
        }

        return (
            <View style={[
                styles.statusBadge,
                openStatus ? styles.openBadge : styles.closedBadge
            ]}>
                <Text style={[
                    styles.statusText,
                    openStatus ? styles.openText : styles.closedText
                ]}>
                    {openStatus ? 'Open' : 'Closed'}
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <Image
                    source={detailedRestaurant.photoUrl ? { uri: detailedRestaurant.photoUrl } : placeholderImage}
                    style={styles.heroImage}
                    contentFit="cover"
                    transition={300}
                    placeholder={placeholderImage}
                    cachePolicy="disk"
                />

                <View style={styles.content}>
                    <View style={styles.nameContainer}>
                        <Text style={styles.name}>{detailedRestaurant.name}</Text>
                        {!isLoading && renderOpenStatusBadge()}
                    </View>

                    <View style={styles.ratingRow}>
                        {renderRatingStars(detailedRestaurant.rating)}
                        {renderPriceLevel(detailedRestaurant.priceLevel)}
                    </View>

                    {detailedRestaurant.types && (
                        <View style={styles.tagsContainer}>
                            {detailedRestaurant.types.slice(0, 3).map((type, index) => (
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
                        {detailedRestaurant.address && (
                            <Text style={styles.address}>{detailedRestaurant.address}</Text>
                        )}

                        <View style={styles.travelInfo}>
                            {detailedRestaurant.distance && (
                                <Text style={styles.travelDetail}>
                                    <FontAwesome name="map-marker" size={16} color={COLORS.PRIMARY} />
                                    {' ' + detailedRestaurant.distance}
                                </Text>
                            )}
                            {detailedRestaurant.duration && (
                                <Text style={styles.travelDetail}>
                                    <FontAwesome name="clock-o" size={16} color={COLORS.PRIMARY} />
                                    {' ' + detailedRestaurant.duration}
                                </Text>
                            )}
                        </View>
                    </View>

                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color={COLORS.PRIMARY} />
                            <Text style={styles.loadingText}>Loading details...</Text>
                        </View>
                    ) : (
                        <>
                            {renderBusinessHours()}

                            {detailedRestaurant.phoneNumber && (
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Contact</Text>
                                    <TouchableOpacity onPress={callRestaurant}>
                                        <Text style={styles.phoneNumber}>
                                            <FontAwesome name="phone" size={16} color={COLORS.PRIMARY} />
                                            {' ' + detailedRestaurant.phoneNumber}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </>
                    )}

                    <TouchableOpacity
                        style={styles.shareButton}
                        onPress={handleShareLocation}
                    >
                        <FontAwesome name="share-alt" size={18} color={COLORS.SURFACE} />
                        <Text style={styles.buttonText}>Share Location</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.directionsButton}
                        onPress={handleGetDirections}
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
    heroImage: {
        width: '100%',
        height: 250,
        backgroundColor: COLORS.GRAY_LIGHT,
    },
    content: {
        padding: 20,
    },
    nameContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    name: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.TEXT,
        flex: 1, // Allow the name to take up most of the space
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
    hoursContainer: {
        marginBottom: 12,
        borderRadius: 8,
        backgroundColor: COLORS.SURFACE,
        overflow: 'hidden',
    },
    hourRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.GRAY_LIGHT,
    },
    todayRow: {
        backgroundColor: COLORS.PRIMARY_LIGHT,
    },
    dayText: {
        fontSize: 16,
        color: COLORS.TEXT,
        fontWeight: '500',
        width: '40%',
    },
    timeText: {
        fontSize: 16,
        color: COLORS.TEXT_SECONDARY,
        width: '60%',
        textAlign: 'right',
    },
    todayText: {
        color: COLORS.PRIMARY,
        fontWeight: '600',
    },
    phoneNumber: {
        fontSize: 16,
        color: COLORS.PRIMARY,
        marginVertical: 8,
        paddingVertical: 10,
        paddingHorizontal: 16,
        backgroundColor: COLORS.SURFACE,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    loadingContainer: {
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: COLORS.TEXT_SECONDARY,
        marginTop: 8,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginLeft: 8,
    },
    openBadge: {
        backgroundColor: COLORS.OPEN_BG,
    },
    closedBadge: {
        backgroundColor: COLORS.CLOSED_BG,
    },
    statusText: {
        fontWeight: '600',
        fontSize: 14,
    },
    openText: {
        color: COLORS.OPEN_TEXT,
    },
    closedText: {
        color: COLORS.CLOSED_TEXT,
    },
}); 