import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking,
    SafeAreaView,
    Share,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants';
import { Restaurant, TravelMode } from '../types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { getPlaceDetails } from '../services/places';
import {
    logger,
    isBusinessOpen,
    getGoogleDayIndex,
    getDirectionsUrl,
    getShareUrl,
    getShareMessage,
    renderPriceLevelText,
    getSpecificType,
    getTodayHours,
    TRAVEL_MODE_ICONS,
} from '../utils';
import { RatingDisplay } from '../components/RatingDisplay';
import { ImageCarousel } from '../components/ImageCarousel';
import { useSavedPlaces } from '../hooks/useSavedPlaces';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = 280;

type RestaurantDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'RestaurantDetail'>;

const getTravelModeIcon = (mode?: TravelMode): keyof typeof FontAwesome.glyphMap => {
    return TRAVEL_MODE_ICONS[mode || 'driving'] as keyof typeof FontAwesome.glyphMap;
};

export const RestaurantDetailScreen: React.FC<RestaurantDetailScreenProps> = ({ route, navigation }) => {
    const { restaurant, userLocation, partnerLocation, travelMode = 'driving' } = route.params;
    const [detailedRestaurant, setDetailedRestaurant] = useState<Restaurant>(restaurant);
    const [isLoading, setIsLoading] = useState(true);
    const [hoursExpanded, setHoursExpanded] = useState(false);
    const { savedIds, toggleSaved } = useSavedPlaces();

    const isSaved = savedIds.has(restaurant.id);

    useEffect(() => {
        const fetchPlaceDetails = async () => {
            try {
                setIsLoading(true);
                const details = await getPlaceDetails(restaurant.id);
                setDetailedRestaurant({
                    ...restaurant,
                    phoneNumber: details.phoneNumber,
                    businessHours: details.businessHours,
                    editorialSummary: details.editorialSummary || restaurant.editorialSummary,
                });
            } catch (error) {
                logger.error('Failed to fetch place details:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPlaceDetails();
    }, [restaurant.id]);

    const handleGetDirections = () => {
        const url = getDirectionsUrl(
            userLocation,
            { latitude: restaurant.latitude, longitude: restaurant.longitude },
            travelMode,
            restaurant.id
        );
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
                url: mapsUrl,
                title: `${restaurant.name} Location`
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

    const handleOpenAddress = () => {
        if (detailedRestaurant.address) {
            const url = `https://maps.apple.com/?q=${encodeURIComponent(detailedRestaurant.address)}`;
            Linking.openURL(url).catch(err =>
                logger.error('Error opening address in maps', err)
            );
        }
    };

    // --- Derived data ---
    const openStatus = isBusinessOpen(detailedRestaurant.businessHours);
    const priceText = renderPriceLevelText(detailedRestaurant.priceLevel);
    const specificType = getSpecificType(detailedRestaurant.types);
    const travelIcon = getTravelModeIcon(travelMode);

    const userDuration = detailedRestaurant.durationA || detailedRestaurant.duration;
    const userDistance = detailedRestaurant.distanceA || detailedRestaurant.distance;
    const partnerDuration = detailedRestaurant.durationB;
    const partnerDistance = detailedRestaurant.distanceB;

    const todayHours = getTodayHours(detailedRestaurant.businessHours);

    // --- Fairness badge ---
    const renderFairnessBadge = () => {
        if (detailedRestaurant.timeDifference === undefined) return null;

        let badgeColor: string = COLORS.SUCCESS;
        let badgeText = 'Very Fair';

        if (detailedRestaurant.timeDifference > 15) {
            badgeColor = COLORS.ERROR;
            badgeText = 'Uneven';
        } else if (detailedRestaurant.timeDifference > 5) {
            badgeColor = COLORS.WARNING;
            badgeText = 'Somewhat Fair';
        }

        return (
            <View style={[styles.fairnessBadge, { backgroundColor: badgeColor }]}>
                <Text style={styles.fairnessBadgeText}>{badgeText}</Text>
            </View>
        );
    };

    // --- Business hours ---
    const renderBusinessHours = () => {
        if (!detailedRestaurant.businessHours || detailedRestaurant.businessHours.length === 0) {
            return null;
        }

        const googleToday = getGoogleDayIndex(new Date().getDay());

        return (
            <View style={styles.section}>
                <TouchableOpacity
                    style={styles.hoursHeader}
                    onPress={() => setHoursExpanded(!hoursExpanded)}
                    activeOpacity={0.7}
                >
                    <View style={styles.hoursHeaderLeft}>
                        <FontAwesome name="clock-o" size={16} color={COLORS.TEXT_SECONDARY} />
                        <Text style={styles.todayHoursText}>
                            Today: {todayHours}
                        </Text>
                    </View>
                    <View style={styles.hoursToggle}>
                        <Text style={styles.hoursToggleText}>
                            {hoursExpanded ? 'Hide' : 'See all'}
                        </Text>
                        <FontAwesome
                            name={hoursExpanded ? 'chevron-up' : 'chevron-down'}
                            size={12}
                            color={COLORS.PRIMARY}
                        />
                    </View>
                </TouchableOpacity>

                {hoursExpanded && (
                    <View style={styles.hoursContainer}>
                        {detailedRestaurant.businessHours.map((hourString, index) => {
                            const [day, hours] = hourString.split(': ');
                            const isToday = index === googleToday;

                            return (
                                <View
                                    key={index}
                                    style={[
                                        styles.hourRow,
                                        isToday && styles.todayRow,
                                        index === detailedRestaurant.businessHours!.length - 1 && styles.lastHourRow,
                                    ]}
                                >
                                    <Text style={[styles.dayText, isToday && styles.todayDayText]}>
                                        {day}
                                    </Text>
                                    <Text style={[styles.timeText, isToday && styles.todayDayText]}>
                                        {hours}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Hero Image Carousel */}
                <View>
                    <ImageCarousel
                        photoUrls={detailedRestaurant.photoUrls}
                        photoUrl={detailedRestaurant.photoUrl}
                        height={HERO_HEIGHT}
                        width={SCREEN_WIDTH}
                        isSaved={isSaved}
                        onToggleSave={() => toggleSaved(restaurant.id)}
                    />
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {/* Name + Open/Closed badge */}
                    <View style={styles.nameRow}>
                        <Text style={styles.name} numberOfLines={2}>{detailedRestaurant.name}</Text>
                        {!isLoading && openStatus !== null && (
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
                        )}
                    </View>

                    {/* Info line: ★ 4.5 (1092) · $$$$ · Steakhouse */}
                    <View style={styles.infoLine}>
                        <RatingDisplay rating={detailedRestaurant.rating} totalRatings={detailedRestaurant.totalRatings} size={15} />
                        {priceText ? (
                            <Text style={styles.infoSeparator}> · <Text style={styles.infoText}>{priceText}</Text></Text>
                        ) : null}
                        {specificType ? (
                            <Text style={styles.infoSeparator}> · <Text style={styles.infoText}>{specificType}</Text></Text>
                        ) : null}
                    </View>

                    {/* Editorial summary from Google */}
                    {detailedRestaurant.editorialSummary && (
                        <Text style={styles.editorialSummary}>
                            {detailedRestaurant.editorialSummary}
                        </Text>
                    )}

                    <View style={styles.divider} />

                    {/* Travel Comparison Section */}
                    {userDuration && (
                        <>
                            <Text style={styles.sectionTitle}>Travel Comparison</Text>
                            <View style={styles.travelComparison}>
                                {/* Your travel */}
                                <View style={styles.travelCard}>
                                    <View style={styles.travelCardHeader}>
                                        <FontAwesome name={travelIcon} size={16} color={COLORS.PRIMARY} />
                                        <Text style={styles.travelCardLabel}>You</Text>
                                    </View>
                                    <Text style={styles.travelCardDuration}>{userDuration}</Text>
                                    {userDistance && (
                                        <Text style={styles.travelCardDistance}>{userDistance}</Text>
                                    )}
                                </View>

                                {/* Partner travel */}
                                {partnerDuration && (
                                    <View style={styles.travelCard}>
                                        <View style={styles.travelCardHeader}>
                                            <FontAwesome name={travelIcon} size={16} color={COLORS.SECONDARY} />
                                            <Text style={styles.travelCardLabel}>Partner</Text>
                                        </View>
                                        <Text style={styles.travelCardDuration}>{partnerDuration}</Text>
                                        {partnerDistance && (
                                            <Text style={styles.travelCardDistance}>{partnerDistance}</Text>
                                        )}
                                    </View>
                                )}
                            </View>

                            {/* Fairness badge centered below */}
                            <View style={styles.fairnessBadgeRow}>
                                {renderFairnessBadge()}
                            </View>

                            <View style={styles.divider} />
                        </>
                    )}

                    {/* Address row - tappable */}
                    {detailedRestaurant.address && (
                        <>
                            <TouchableOpacity
                                style={styles.addressRow}
                                onPress={handleOpenAddress}
                                activeOpacity={0.7}
                            >
                                <FontAwesome name="map-marker" size={18} color={COLORS.PRIMARY} style={styles.addressIcon} />
                                <Text style={styles.addressText} numberOfLines={2}>
                                    {detailedRestaurant.address}
                                </Text>
                                <FontAwesome name="chevron-right" size={14} color={COLORS.GRAY} />
                            </TouchableOpacity>
                            <View style={styles.divider} />
                        </>
                    )}

                    {/* Business hours / Loading */}
                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color={COLORS.PRIMARY} />
                            <Text style={styles.loadingText}>Loading details...</Text>
                        </View>
                    ) : (
                        <>
                            {renderBusinessHours()}

                            {/* Phone row - tappable */}
                            {detailedRestaurant.phoneNumber && (
                                <>
                                    {detailedRestaurant.businessHours && detailedRestaurant.businessHours.length > 0 && (
                                        <View style={styles.divider} />
                                    )}
                                    <TouchableOpacity
                                        style={styles.phoneRow}
                                        onPress={callRestaurant}
                                        activeOpacity={0.7}
                                    >
                                        <FontAwesome name="phone" size={16} color={COLORS.PRIMARY} style={styles.addressIcon} />
                                        <Text style={styles.phoneText}>
                                            {detailedRestaurant.phoneNumber}
                                        </Text>
                                        <FontAwesome name="chevron-right" size={14} color={COLORS.GRAY} />
                                    </TouchableOpacity>
                                </>
                            )}
                        </>
                    )}
                </View>
            </ScrollView>

            {/* Sticky Bottom Action Bar */}
            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={styles.directionsButton}
                    onPress={handleGetDirections}
                    activeOpacity={0.8}
                >
                    <FontAwesome name="map" size={16} color={COLORS.SURFACE} />
                    <Text style={styles.directionsButtonText}>Get Directions</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={handleShareLocation}
                    activeOpacity={0.7}
                >
                    <FontAwesome name="share-alt" size={18} color={COLORS.PRIMARY} />
                </TouchableOpacity>

                {detailedRestaurant.phoneNumber && (
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={callRestaurant}
                        activeOpacity={0.7}
                    >
                        <FontAwesome name="phone" size={18} color={COLORS.PRIMARY} />
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.SURFACE,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: SPACING.LARGE,
    },
    content: {
        paddingHorizontal: SPACING.LARGE,
        paddingTop: SPACING.LARGE,
    },

    // --- Name + Status ---
    nameRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.SMALL,
    },
    name: {
        fontSize: FONT_SIZES.XXL,
        fontWeight: '700',
        color: COLORS.TEXT,
        flex: 1,
        marginRight: SPACING.SMALL,
    },
    statusBadge: {
        paddingHorizontal: SPACING.SMALL,
        paddingVertical: SPACING.XS,
        borderRadius: BORDER_RADIUS.XL,
        marginTop: SPACING.XS,
    },
    openBadge: {
        backgroundColor: COLORS.OPEN_BG,
    },
    closedBadge: {
        backgroundColor: COLORS.CLOSED_BG,
    },
    statusText: {
        fontWeight: '600',
        fontSize: FONT_SIZES.SMALL,
    },
    openText: {
        color: COLORS.OPEN_TEXT,
    },
    closedText: {
        color: COLORS.CLOSED_TEXT,
    },

    // --- Info line ---
    infoLine: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: SPACING.MEDIUM,
    },
    infoSeparator: {
        fontSize: FONT_SIZES.MEDIUM,
        color: COLORS.TEXT_SECONDARY,
    },
    infoText: {
        fontSize: FONT_SIZES.MEDIUM,
        color: COLORS.TEXT_SECONDARY,
    },

    // --- Editorial summary ---
    editorialSummary: {
        fontSize: FONT_SIZES.MEDIUM,
        color: COLORS.TEXT_SECONDARY,
        lineHeight: 20,
        marginBottom: SPACING.XS,
    },

    // --- Divider ---
    divider: {
        height: 1,
        backgroundColor: COLORS.GRAY_LIGHT,
        marginVertical: SPACING.MEDIUM,
    },

    // --- Section ---
    section: {
        marginBottom: SPACING.XS,
    },
    sectionTitle: {
        fontSize: FONT_SIZES.LARGE,
        fontWeight: '600',
        color: COLORS.TEXT,
        marginBottom: SPACING.MEDIUM,
    },

    // --- Travel Comparison ---
    travelComparison: {
        flexDirection: 'row',
        gap: SPACING.MEDIUM,
    },
    travelCard: {
        flex: 1,
        backgroundColor: COLORS.BACKGROUND,
        borderRadius: BORDER_RADIUS.LARGE,
        padding: SPACING.MEDIUM,
        alignItems: 'center',
    },
    travelCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.SMALL,
        marginBottom: SPACING.SMALL,
    },
    travelCardLabel: {
        fontSize: FONT_SIZES.MEDIUM,
        fontWeight: '600',
        color: COLORS.TEXT,
    },
    travelCardDuration: {
        fontSize: FONT_SIZES.XL,
        fontWeight: '700',
        color: COLORS.TEXT,
    },
    travelCardDistance: {
        fontSize: FONT_SIZES.SMALL,
        color: COLORS.TEXT_SECONDARY,
        marginTop: SPACING.XS,
    },
    fairnessBadgeRow: {
        alignItems: 'center',
        marginTop: SPACING.MEDIUM,
    },
    fairnessBadge: {
        paddingHorizontal: SPACING.MEDIUM,
        paddingVertical: SPACING.XS,
        borderRadius: BORDER_RADIUS.XL,
    },
    fairnessBadgeText: {
        color: COLORS.SURFACE,
        fontSize: FONT_SIZES.SMALL,
        fontWeight: '600',
    },

    // --- Address row ---
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.SMALL,
    },
    addressIcon: {
        width: 24,
        textAlign: 'center',
        marginRight: SPACING.MEDIUM,
    },
    addressText: {
        flex: 1,
        fontSize: FONT_SIZES.MEDIUM,
        color: COLORS.TEXT,
        lineHeight: 20,
    },

    // --- Hours ---
    hoursHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.SMALL,
    },
    hoursHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.MEDIUM,
    },
    todayHoursText: {
        fontSize: FONT_SIZES.MEDIUM,
        color: COLORS.TEXT,
        fontWeight: '500',
    },
    hoursToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.XS,
    },
    hoursToggleText: {
        fontSize: FONT_SIZES.MEDIUM,
        color: COLORS.PRIMARY,
        fontWeight: '500',
    },
    hoursContainer: {
        marginTop: SPACING.SMALL,
        borderRadius: BORDER_RADIUS.MEDIUM,
        backgroundColor: COLORS.BACKGROUND,
        overflow: 'hidden',
    },
    hourRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: SPACING.SMALL,
        paddingHorizontal: SPACING.MEDIUM,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.GRAY_LIGHT,
    },
    lastHourRow: {
        borderBottomWidth: 0,
    },
    todayRow: {
        backgroundColor: COLORS.PRIMARY_LIGHT,
    },
    dayText: {
        fontSize: FONT_SIZES.MEDIUM,
        color: COLORS.TEXT,
        fontWeight: '500',
        width: '40%',
    },
    timeText: {
        fontSize: FONT_SIZES.MEDIUM,
        color: COLORS.TEXT_SECONDARY,
        width: '60%',
        textAlign: 'right',
    },
    todayDayText: {
        color: COLORS.PRIMARY,
        fontWeight: '600',
    },

    // --- Phone row ---
    phoneRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.SMALL,
    },
    phoneText: {
        flex: 1,
        fontSize: FONT_SIZES.MEDIUM,
        color: COLORS.PRIMARY,
        fontWeight: '500',
    },

    // --- Loading ---
    loadingContainer: {
        padding: SPACING.MEDIUM,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        fontSize: FONT_SIZES.MEDIUM,
        color: COLORS.TEXT_SECONDARY,
        marginTop: SPACING.SMALL,
    },

    // --- Bottom Bar ---
    bottomBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.LARGE,
        paddingVertical: SPACING.MEDIUM,
        borderTopWidth: 1,
        borderTopColor: COLORS.GRAY_LIGHT,
        backgroundColor: COLORS.SURFACE,
        gap: SPACING.SMALL,
    },
    directionsButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.PRIMARY,
        paddingVertical: SPACING.MEDIUM,
        borderRadius: BORDER_RADIUS.LARGE,
        gap: SPACING.SMALL,
    },
    directionsButtonText: {
        color: COLORS.SURFACE,
        fontSize: FONT_SIZES.LARGE,
        fontWeight: '600',
    },
    iconButton: {
        width: 48,
        height: 48,
        borderRadius: BORDER_RADIUS.LARGE,
        borderWidth: 1,
        borderColor: COLORS.GRAY_LIGHT,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
