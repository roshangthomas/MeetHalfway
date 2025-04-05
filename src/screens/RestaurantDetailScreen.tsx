import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Linking, SafeAreaView, Platform, Share, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { Restaurant, Location, TravelMode } from '../types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { getPlaceDetails } from '../services/places';

type RestaurantDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'RestaurantDetail'>;

export const RestaurantDetailScreen: React.FC<RestaurantDetailScreenProps> = ({ route, navigation }) => {
    const { restaurant, userLocation, travelMode = 'driving' } = route.params;
    const [detailedRestaurant, setDetailedRestaurant] = useState<Restaurant>(restaurant);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch place details when the component mounts
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
                console.error('Failed to fetch place details:', error);
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

        let url;
        if (Platform.OS === 'ios') {
            // Use alternative Apple Maps URL scheme for better control of transport mode
            if (travelMode === 'driving') {
                // Specific format for driving directions
                url = `http://maps.apple.com/?saddr=${userLocation.latitude},${userLocation.longitude}&daddr=${destination}&dirflg=d`;
            } else {
                // Format for other travel modes
                const dirFlag = getAppleMapsDirectionFlag(travelMode);
                url = `http://maps.apple.com/?saddr=${userLocation.latitude},${userLocation.longitude}&daddr=${destination}&dirflg=${dirFlag}`;
            }
        } else {
            // Use the Google Maps directions URL to show preview instead of starting navigation directly
            url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${destination}&travelmode=${travelMode}`;

            // Optional: Add restaurant place ID for better location pinpointing
            if (restaurant.id) {
                url += `&destination_place_id=${restaurant.id}`;
            }
        }

        if (url) {
            console.log(`Opening maps with URL: ${url}, travel mode: ${travelMode}`);
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

    const callRestaurant = () => {
        if (detailedRestaurant.phoneNumber) {
            Linking.openURL(`tel:${detailedRestaurant.phoneNumber}`);
        }
    };

    // Add a function to format and parse business hours
    const renderBusinessHours = () => {
        if (!detailedRestaurant.businessHours || detailedRestaurant.businessHours.length === 0) {
            return null;
        }

        // Get current day of week (0 = Sunday, 1 = Monday, etc.)
        const today = new Date().getDay();
        // Convert to Google's format (0 = Monday, 6 = Sunday)
        const googleToday = today === 0 ? 6 : today - 1;

        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Business Hours</Text>
                <View style={styles.hoursContainer}>
                    {detailedRestaurant.businessHours.map((hourString, index) => {
                        // Split the day and hours (e.g., "Monday: 9:00 AM – 10:00 PM")
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

    // Function to determine if restaurant is currently open
    const isRestaurantOpen = (): boolean | null => {
        if (!detailedRestaurant.businessHours || detailedRestaurant.businessHours.length === 0) {
            return null; // Unknown status
        }

        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
        // Convert to Google's format (0 = Monday, 6 = Sunday)
        const googleDayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

        // Get hours for today
        const todayHours = detailedRestaurant.businessHours[googleDayIndex];
        if (!todayHours || todayHours.includes('Closed')) {
            return false; // Closed today
        }

        // Parse hours (e.g., "Monday: 9:00 AM – 10:00 PM")
        const hoursMatch = todayHours.match(/(\d+:\d+\s*(?:AM|PM))\s*–\s*(\d+:\d+\s*(?:AM|PM))/i);
        if (!hoursMatch) {
            return null; // Can't determine
        }

        const [_, openTime, closeTime] = hoursMatch;

        // Convert current time, open time, and close time to minutes since midnight
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const openMinutes = convertTimeToMinutes(openTime);
        const closeMinutes = convertTimeToMinutes(closeTime);

        return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
    };

    // Helper to convert time string to minutes since midnight
    const convertTimeToMinutes = (timeStr: string): number => {
        // Clean up the time string
        const cleanTimeStr = timeStr.trim().toUpperCase();

        // Parse hours and minutes
        const [hourMin, period] = cleanTimeStr.split(/\s+/);
        const [hours, minutes] = hourMin.split(':').map(Number);

        // Convert to 24-hour format
        let totalHours = hours;
        if (period === 'PM' && hours < 12) {
            totalHours += 12;
        } else if (period === 'AM' && hours === 12) {
            totalHours = 0;
        }

        return totalHours * 60 + minutes;
    };

    // Render open/closed status badge
    const renderOpenStatusBadge = () => {
        const openStatus = isRestaurantOpen();

        if (openStatus === null) {
            return null; // Don't show if we can't determine
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
                    source={
                        detailedRestaurant.photoUrl
                            ? { uri: detailedRestaurant.photoUrl }
                            : require('../../assets/placeholder-restaurant.png')
                    }
                    style={styles.heroImage}
                    resizeMode="cover"
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
        backgroundColor: 'rgba(39, 174, 96, 0.2)', // Light green background
    },
    closedBadge: {
        backgroundColor: 'rgba(231, 76, 60, 0.2)', // Light red background
    },
    statusText: {
        fontWeight: '600',
        fontSize: 14,
    },
    openText: {
        color: '#27AE60', // Green text
    },
    closedText: {
        color: '#E74C3C', // Red text
    },
}); 