import React from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    FlatList,
    Dimensions,
    Platform,
    TouchableOpacity,
} from 'react-native';
import { Restaurant, Location, TravelMode } from '../types';
import { COLORS } from '../constants/colors';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { RatingDisplay } from './RatingDisplay';

interface RestaurantListProps {
    restaurants: Restaurant[];
    userLocation: Location;
    partnerLocation?: Location;
    travelMode?: TravelMode;
}

const RestaurantCard: React.FC<{
    restaurant: Restaurant,
    userLocation: Location,
    partnerLocation?: Location,
    travelMode?: TravelMode
}> = ({
    restaurant,
    userLocation,
    partnerLocation,
    travelMode
}) => {
        const navigation = useNavigation<NavigationProp<RootStackParamList>>();

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

        const handlePress = () => {
            navigation.navigate('RestaurantDetail', {
                restaurant,
                userLocation,
                partnerLocation: partnerLocation || userLocation,
                travelMode: travelMode || 'driving'
            });
        };

        // Render fairness badge if time difference is available
        const renderFairnessBadge = () => {
            if (restaurant.timeDifference === undefined) return null;

            let badgeColor = COLORS.SUCCESS;
            let badgeText = 'Very Fair';

            if (restaurant.timeDifference > 15) {
                badgeColor = COLORS.ERROR;
                badgeText = 'Uneven';
            } else if (restaurant.timeDifference > 5) {
                badgeColor = COLORS.WARNING;
                badgeText = 'Somewhat Fair';
            }

            return (
                <View style={[styles.fairnessBadge, { backgroundColor: badgeColor }]}>
                    <Text style={styles.fairnessBadgeText}>{badgeText}</Text>
                </View>
            );
        };

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={handlePress}
                activeOpacity={0.7}
            >
                <Image
                    source={
                        restaurant.photoUrl
                            ? { uri: restaurant.photoUrl }
                            : require('../../assets/placeholder-restaurant.png')
                    }
                    style={styles.image}
                    resizeMode="cover"
                />
                {renderFairnessBadge()}
                <View style={styles.contentContainer}>
                    <Text style={styles.name}>{restaurant.name}</Text>
                    {restaurant.types && (
                        <Text style={styles.types}>
                            {restaurant.types.slice(0, 2).join(' • ')}
                        </Text>
                    )}
                    <View style={styles.ratingRow}>
                        <RatingDisplay rating={restaurant.rating} totalRatings={restaurant.totalRatings} />
                        {renderPriceLevel(restaurant.priceLevel)}
                    </View>
                    {restaurant.address && (
                        <Text style={styles.address} numberOfLines={1}>
                            {restaurant.address}
                        </Text>
                    )}

                    {/* Travel info section */}
                    <View style={styles.travelInfoContainer}>
                        {/* Your travel info */}
                        <View style={styles.travelInfoColumn}>
                            <Text style={styles.travelInfoLabel}>Your Travel:</Text>
                            {restaurant.durationA ? (
                                <Text style={styles.travelDetail}>
                                    <FontAwesome name="clock-o" size={14} color={COLORS.PRIMARY} />
                                    {' ' + restaurant.durationA}
                                </Text>
                            ) : restaurant.duration ? (
                                <Text style={styles.travelDetail}>
                                    <FontAwesome name="clock-o" size={14} color={COLORS.PRIMARY} />
                                    {' ' + restaurant.duration}
                                </Text>
                            ) : null}

                            {restaurant.distanceA ? (
                                <Text style={styles.travelDetail}>
                                    <FontAwesome name="map-marker" size={14} color={COLORS.PRIMARY} />
                                    {' ' + restaurant.distanceA}
                                </Text>
                            ) : restaurant.distance ? (
                                <Text style={styles.travelDetail}>
                                    <FontAwesome name="map-marker" size={14} color={COLORS.PRIMARY} />
                                    {' ' + restaurant.distance}
                                </Text>
                            ) : null}
                        </View>

                        {/* Partner travel info - only show if we have partner location */}
                        {partnerLocation && (
                            <View style={styles.travelInfoColumn}>
                                <Text style={styles.travelInfoLabel}>Partner Travel:</Text>
                                {restaurant.durationB && (
                                    <Text style={styles.travelDetail}>
                                        <FontAwesome name="clock-o" size={14} color={COLORS.SECONDARY} />
                                        {' ' + restaurant.durationB}
                                    </Text>
                                )}
                                {restaurant.distanceB && (
                                    <Text style={styles.travelDetail}>
                                        <FontAwesome name="map-marker" size={14} color={COLORS.SECONDARY} />
                                        {' ' + restaurant.distanceB}
                                    </Text>
                                )}
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

export const RestaurantList: React.FC<RestaurantListProps> = ({
    restaurants,
    userLocation,
    partnerLocation,
    travelMode
}) => {
    return (
        <FlatList
            data={restaurants}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
                <RestaurantCard
                    restaurant={item}
                    userLocation={userLocation}
                    partnerLocation={partnerLocation}
                    travelMode={travelMode}
                />
            )}
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
    travelInfoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    travelInfoColumn: {
        flex: 1,
    },
    travelInfoLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.TEXT,
        marginBottom: 4,
    },
    travelInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    travelDetail: {
        fontSize: 14,
        color: COLORS.TEXT_SECONDARY,
        marginBottom: 2,
    },
    fairnessBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        zIndex: 1,
    },
    fairnessBadgeText: {
        color: COLORS.SURFACE,
        fontSize: 12,
        fontWeight: '600',
    },
}); 