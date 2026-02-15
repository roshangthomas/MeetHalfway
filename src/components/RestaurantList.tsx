import React, { useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Animated,
    Dimensions,
} from 'react-native';
import { Restaurant, Location, TravelMode } from '../types';
import { COLORS } from '../constants';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { RatingDisplay } from './RatingDisplay';
import { ImageCarousel } from './ImageCarousel';
import { useSavedPlaces } from '../hooks/useSavedPlaces';
import { renderPriceLevelText, isBusinessOpen, getShortLocation, getSpecificType, TRAVEL_MODE_ICONS } from '../utils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_HORIZONTAL_MARGIN = 16;

interface RestaurantListProps {
    restaurants: Restaurant[];
    userLocation: Location;
    partnerLocation?: Location;
    travelMode?: TravelMode;
}

const getTravelModeIcon = (mode?: TravelMode): keyof typeof FontAwesome.glyphMap => {
    return TRAVEL_MODE_ICONS[mode || 'driving'] as keyof typeof FontAwesome.glyphMap;
};

// --- Restaurant Card ---
const RestaurantCard = React.memo<{
    restaurant: Restaurant;
    userLocation: Location;
    partnerLocation?: Location;
    travelMode?: TravelMode;
    isSaved: boolean;
    onToggleSave: () => void;
}>(({
    restaurant,
    userLocation,
    partnerLocation,
    travelMode,
    isSaved,
    onToggleSave,
}) => {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.98,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4,
        }).start();
    };

    const handlePress = () => {
        navigation.navigate('RestaurantDetail', {
            restaurant,
            userLocation,
            partnerLocation: partnerLocation || userLocation,
            travelMode: travelMode || 'driving',
        });
    };

    // --- Fairness badge ---
    const renderFairnessBadge = () => {
        if (restaurant.timeDifference === undefined) return null;

        let badgeColor: string = COLORS.SUCCESS;
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

    // --- Build the info line: ★ 4.0 (146) · $$ · Orinda ---
    const priceText = renderPriceLevelText(restaurant.priceLevel);
    const shortLocation = getShortLocation(restaurant.address);
    const specificType = getSpecificType(restaurant.types);

    // --- Open/Closed status ---
    const openStatus = isBusinessOpen(restaurant.businessHours);

    // --- Condensed travel info ---
    const userDuration = restaurant.durationA || restaurant.duration;
    const partnerDuration = restaurant.durationB;
    const travelIcon = getTravelModeIcon(travelMode);

    return (
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
            <TouchableOpacity
                activeOpacity={1}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={handlePress}
            >
                {/* Image carousel with heart + fairness badge */}
                <View>
                    <ImageCarousel
                        photoUrls={restaurant.photoUrls}
                        photoUrl={restaurant.photoUrl}
                        isSaved={isSaved}
                        onToggleSave={onToggleSave}
                    />
                    {renderFairnessBadge()}
                </View>

                {/* Content area */}
                <View style={styles.contentContainer}>
                    {/* Name */}
                    <Text style={styles.name} numberOfLines={1}>{restaurant.name}</Text>

                    {/* Info line: ★ 4.0 (146) · $$ · Italian · Orinda */}
                    <View style={styles.infoLine}>
                        <RatingDisplay rating={restaurant.rating} totalRatings={restaurant.totalRatings} size={13} />
                        {priceText ? (
                            <Text style={styles.infoSeparator}> · <Text style={styles.infoText}>{priceText}</Text></Text>
                        ) : null}
                        {specificType ? (
                            <Text style={styles.infoSeparator}> · <Text style={styles.infoText}>{specificType}</Text></Text>
                        ) : null}
                        {shortLocation ? (
                            <Text style={styles.infoSeparator}> · <Text style={styles.infoText}>{shortLocation}</Text></Text>
                        ) : null}
                    </View>

                    {/* Editorial summary / cuisine description */}
                    {restaurant.editorialSummary && (
                        <Text style={styles.editorialText} numberOfLines={1}>
                            {restaurant.editorialSummary}
                        </Text>
                    )}

                    {/* Open/Closed status */}
                    {openStatus !== null && (
                        <Text style={openStatus ? styles.openText : styles.closedText}>
                            {openStatus ? 'Open now' : 'Closed'}
                        </Text>
                    )}

                    {/* Travel info chips */}
                    {userDuration && (
                        <View style={styles.travelRow}>
                            <View style={styles.travelChip}>
                                <FontAwesome name={travelIcon} size={12} color={COLORS.PRIMARY} />
                                <Text style={styles.travelChipText}>You: {userDuration}</Text>
                            </View>
                            {partnerLocation && partnerDuration && (
                                <View style={styles.travelChip}>
                                    <FontAwesome name={travelIcon} size={12} color={COLORS.SECONDARY} />
                                    <Text style={styles.travelChipText}>Partner: {partnerDuration}</Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
});

RestaurantCard.displayName = 'RestaurantCard';

// --- Main List ---
export const RestaurantList: React.FC<RestaurantListProps> = ({
    restaurants,
    userLocation,
    partnerLocation,
    travelMode,
}) => {
    const { savedIds, toggleSaved } = useSavedPlaces();

    const renderItem = useCallback(({ item }: { item: Restaurant }) => (
        <RestaurantCard
            restaurant={item}
            userLocation={userLocation}
            partnerLocation={partnerLocation}
            travelMode={travelMode}
            isSaved={savedIds.has(item.id)}
            onToggleSave={() => toggleSaved(item.id)}
        />
    ), [userLocation, partnerLocation, travelMode, savedIds, toggleSaved]);

    return (
        <FlatList
            data={restaurants}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            windowSize={5}
            initialNumToRender={5}
            maxToRenderPerBatch={5}
            removeClippedSubviews={true}
        />
    );
};

// --- Styles ---
const styles = StyleSheet.create({
    list: {
        paddingHorizontal: CARD_HORIZONTAL_MARGIN,
        paddingTop: 8,
        paddingBottom: 20,
    },
    card: {
        marginBottom: 24,
    },
    fairnessBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 14,
    },
    fairnessBadgeText: {
        color: COLORS.SURFACE,
        fontSize: 12,
        fontWeight: '600',
    },
    // --- Content ---
    contentContainer: {
        paddingTop: 10,
        paddingBottom: 4,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.TEXT,
        marginBottom: 3,
    },
    infoLine: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: 4,
    },
    infoSeparator: {
        fontSize: 13,
        color: COLORS.TEXT_SECONDARY,
    },
    infoText: {
        fontSize: 13,
        color: COLORS.TEXT_SECONDARY,
    },
    editorialText: {
        fontSize: 13,
        color: COLORS.TEXT_SECONDARY,
        marginBottom: 4,
    },
    openText: {
        fontSize: 13,
        color: COLORS.OPEN_TEXT,
        fontWeight: '500',
        marginBottom: 4,
    },
    closedText: {
        fontSize: 13,
        color: COLORS.CLOSED_TEXT,
        fontWeight: '500',
        marginBottom: 4,
    },
    // --- Travel chips ---
    travelRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 4,
    },
    travelChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: COLORS.BACKGROUND,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 16,
    },
    travelChipText: {
        fontSize: 12,
        color: COLORS.TEXT_SECONDARY,
        fontWeight: '500',
    },
});
