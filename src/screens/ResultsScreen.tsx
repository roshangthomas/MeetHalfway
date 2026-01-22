import React, { useState, useEffect, useMemo } from 'react';
import { View, SafeAreaView, Text, TouchableOpacity } from 'react-native';
import { RestaurantList } from '../components/RestaurantList';
import { SortOption, RootStackParamList } from '../types';
import { styles } from '../styles/Results.styles';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { COLORS } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { FilterModal, FilterOptions } from '../components/FilterModal';
import { FontAwesome } from '@expo/vector-icons';
import { AntDesign } from '@expo/vector-icons';
import { SortModal } from '../components/SortModal';
import * as Font from 'expo-font';
import { parseDurationToMinutes } from '../utils/duration';

type ResultsScreenProps = NativeStackScreenProps<RootStackParamList, 'Results'>;

export const ResultsScreen: React.FC<ResultsScreenProps> = ({ route, navigation }) => {
    const { restaurants, userLocation, partnerLocation, midpointLocation, travelMode } = route.params;
    const [sortOption, setSortOption] = useState<SortOption>('distance');
    const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
    const [isSortModalVisible, setIsSortModalVisible] = useState(false);
    const [fontsLoaded, setFontsLoaded] = useState(false);
    const [filters, setFilters] = useState<FilterOptions>({
        minRating: 0,
        minReviews: 0,
        maxPrice: 4,
    });

    // Load fonts
    useEffect(() => {
        async function loadFonts() {
            await Font.loadAsync({
                ...FontAwesome.font,
                ...Ionicons.font,
                ...AntDesign.font
            });
            setFontsLoaded(true);
        }
        loadFonts();
    }, []);

    const sortedAndFilteredRestaurants = useMemo(() => {
        // First apply filters
        let filteredResults = restaurants.filter(restaurant => {
            // Filter by minimum rating
            if (filters.minRating > 0 && (!restaurant.rating || restaurant.rating < filters.minRating)) {
                return false;
            }

            // Filter by minimum reviews
            if (filters.minReviews > 0 && (!restaurant.totalRatings || restaurant.totalRatings < filters.minReviews)) {
                return false;
            }

            // Filter by price level
            if (restaurant.priceLevel && restaurant.priceLevel > filters.maxPrice) {
                return false;
            }

            return true;
        });

        // Then sort the filtered results
        return [...filteredResults].sort((a, b) => {
            switch (sortOption) {
                case 'rating':
                    return (b.rating || 0) - (a.rating || 0);
                case 'price':
                    return (a.priceLevel || 0) - (b.priceLevel || 0);
                case 'travelTimeDiff':
                    // Calculate travel time difference for sorting
                    const aUserTime = a.durationA ? parseDurationToMinutes(a.durationA) : 0;
                    const aFriendTime = a.durationB ? parseDurationToMinutes(a.durationB) : 0;
                    const aDiff = Math.abs(aUserTime - aFriendTime);

                    const bUserTime = b.durationA ? parseDurationToMinutes(b.durationA) : 0;
                    const bFriendTime = b.durationB ? parseDurationToMinutes(b.durationB) : 0;
                    const bDiff = Math.abs(bUserTime - bFriendTime);

                    return aDiff - bDiff;
                case 'distance':
                default:
                    // Default sort by distance
                    const aDistance = a.distance ? parseFloat(a.distance.replace(/[^0-9.]/g, '')) : 0;
                    const bDistance = b.distance ? parseFloat(b.distance.replace(/[^0-9.]/g, '')) : 0;
                    return aDistance - bDistance;
            }
        });
    }, [restaurants, sortOption, filters]);

    const handleApplyFilters = (newFilters: FilterOptions) => {
        setFilters(newFilters);
        setIsFilterModalVisible(false);
    };

    const handleApplySort = (newSortOption: SortOption) => {
        setSortOption(newSortOption);
        setIsSortModalVisible(false);
    };

    // Get the active filter count
    const getActiveFilterCount = (): number => {
        let count = 0;
        if (filters.minRating > 0) count++;
        if (filters.minReviews > 0) count++;
        if (filters.maxPrice < 4) count++;
        return count;
    };

    // Get sort option display name
    const getSortOptionDisplayName = (): string => {
        switch (sortOption) {
            case 'distance':
                return 'Distance';
            case 'rating':
                return 'Rating';
            case 'price':
                return 'Price';
            case 'travelTimeDiff':
                return 'Travel Time';
            default:
                return 'Distance';
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Filter and Sort Bar */}
                <View style={styles.filterSortBar}>
                    <View style={styles.divider} />

                    <View style={styles.filterSortButtonsContainer}>
                        <TouchableOpacity
                            style={styles.filterSortButton}
                            onPress={() => setIsFilterModalVisible(true)}
                        >
                            <Text style={styles.filterSortButtonText}>
                                Filters{getActiveFilterCount() > 0 ? ` (${getActiveFilterCount()})` : ''}
                            </Text>
                            <FontAwesome name="filter" size={20} color="black" />
                        </TouchableOpacity>

                        <View style={styles.verticalDivider} />

                        <TouchableOpacity
                            style={styles.filterSortButton}
                            onPress={() => setIsSortModalVisible(true)}
                        >
                            <Text style={styles.filterSortButtonText}>
                                Sort: {getSortOptionDisplayName()}
                            </Text>
                            <FontAwesome name="sort" size={20} color={COLORS.TEXT} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.divider} />
                </View>

                <View style={styles.listContainer}>
                    {sortedAndFilteredRestaurants.length > 0 ? (
                        <RestaurantList
                            restaurants={sortedAndFilteredRestaurants}
                            userLocation={userLocation}
                            partnerLocation={partnerLocation}
                            travelMode={travelMode}
                        />
                    ) : (
                        <View style={styles.noResultsContainer}>
                            <Text style={styles.noResultsText}>
                                No restaurants match your current filters. Try adjusting your filters to see more results.
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            <FilterModal
                visible={isFilterModalVisible}
                onClose={() => setIsFilterModalVisible(false)}
                onApply={handleApplyFilters}
                initialFilters={filters}
            />

            <SortModal
                visible={isSortModalVisible}
                onClose={() => setIsSortModalVisible(false)}
                onApply={handleApplySort}
                currentSortOption={sortOption}
            />
        </SafeAreaView>
    );
}; 