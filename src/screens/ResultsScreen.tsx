import React, { useState, useEffect, useMemo } from 'react';
import { View, SafeAreaView, Text, TouchableOpacity, ScrollView } from 'react-native';
import { RestaurantList } from '../components/RestaurantList';
import { SortOption, RootStackParamList } from '../types';
import { styles } from '../styles/Results.styles';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { COLORS } from '../constants';
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
    const [filters, setFilters] = useState<FilterOptions>({
        minRating: 0,
        minReviews: 0,
        maxPrice: 4,
    });

    useEffect(() => {
        async function loadFonts() {
            await Font.loadAsync({
                ...FontAwesome.font,
                ...Ionicons.font,
                ...AntDesign.font
            });
        }
        loadFonts();
    }, []);

    const sortedAndFilteredRestaurants = useMemo(() => {
        let filteredResults = restaurants.filter(restaurant => {
            if (filters.minRating > 0 && (!restaurant.rating || restaurant.rating < filters.minRating)) {
                return false;
            }

            if (filters.minReviews > 0 && (!restaurant.totalRatings || restaurant.totalRatings < filters.minReviews)) {
                return false;
            }

            if (restaurant.priceLevel && restaurant.priceLevel > filters.maxPrice) {
                return false;
            }

            return true;
        });

        return [...filteredResults].sort((a, b) => {
            switch (sortOption) {
                case 'rating':
                    return (b.rating || 0) - (a.rating || 0);
                case 'price':
                    return (a.priceLevel || 0) - (b.priceLevel || 0);
                case 'travelTimeDiff':
                    const aUserTime = a.durationA ? parseDurationToMinutes(a.durationA) : 0;
                    const aFriendTime = a.durationB ? parseDurationToMinutes(a.durationB) : 0;
                    const aDiff = Math.abs(aUserTime - aFriendTime);

                    const bUserTime = b.durationA ? parseDurationToMinutes(b.durationA) : 0;
                    const bFriendTime = b.durationB ? parseDurationToMinutes(b.durationB) : 0;
                    const bDiff = Math.abs(bUserTime - bFriendTime);

                    return aDiff - bDiff;
                case 'distance':
                default:
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

    const getActiveFilterCount = (): number => {
        let count = 0;
        if (filters.minRating > 0) count++;
        if (filters.minReviews > 0) count++;
        if (filters.maxPrice < 4) count++;
        return count;
    };

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

    const activeFilterCount = getActiveFilterCount();
    const hasActiveFilters = activeFilterCount > 0;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Pill chip filter/sort bar */}
                <View style={styles.filterSortBar}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.pillScrollContent}
                    >
                        {/* Filters pill */}
                        <TouchableOpacity
                            style={[
                                styles.pillChip,
                                hasActiveFilters && styles.pillChipActive,
                            ]}
                            onPress={() => setIsFilterModalVisible(true)}
                        >
                            <Ionicons
                                name="options-outline"
                                size={16}
                                color={hasActiveFilters ? COLORS.SURFACE : COLORS.TEXT}
                            />
                            <Text style={[
                                styles.pillChipText,
                                hasActiveFilters && styles.pillChipTextActive,
                            ]}>
                                Filters{hasActiveFilters ? ` (${activeFilterCount})` : ''}
                            </Text>
                        </TouchableOpacity>

                        {/* Sort pill */}
                        <TouchableOpacity
                            style={[
                                styles.pillChip,
                                sortOption !== 'distance' && styles.pillChipActive,
                            ]}
                            onPress={() => setIsSortModalVisible(true)}
                        >
                            <FontAwesome
                                name="sort-amount-asc"
                                size={14}
                                color={sortOption !== 'distance' ? COLORS.SURFACE : COLORS.TEXT}
                            />
                            <Text style={[
                                styles.pillChipText,
                                sortOption !== 'distance' && styles.pillChipTextActive,
                            ]}>
                                {getSortOptionDisplayName()}
                            </Text>
                            <FontAwesome
                                name="chevron-down"
                                size={10}
                                color={sortOption !== 'distance' ? COLORS.SURFACE : COLORS.TEXT_SECONDARY}
                            />
                        </TouchableOpacity>

                        {/* Quick filter: Rating 4+ */}
                        <TouchableOpacity
                            style={[
                                styles.pillChip,
                                filters.minRating >= 4 && styles.pillChipActive,
                            ]}
                            onPress={() => {
                                setFilters(prev => ({
                                    ...prev,
                                    minRating: prev.minRating >= 4 ? 0 : 4,
                                }));
                            }}
                        >
                            <FontAwesome
                                name="star"
                                size={12}
                                color={filters.minRating >= 4 ? COLORS.SURFACE : COLORS.TEXT}
                            />
                            <Text style={[
                                styles.pillChipText,
                                filters.minRating >= 4 && styles.pillChipTextActive,
                            ]}>
                                4+
                            </Text>
                        </TouchableOpacity>

                        {/* Quick filter: $$ (price ≤ 2) */}
                        <TouchableOpacity
                            style={[
                                styles.pillChip,
                                filters.maxPrice <= 2 && styles.pillChipActive,
                            ]}
                            onPress={() => {
                                setFilters(prev => ({
                                    ...prev,
                                    maxPrice: prev.maxPrice <= 2 ? 4 : 2,
                                }));
                            }}
                        >
                            <Text style={[
                                styles.pillChipText,
                                filters.maxPrice <= 2 && styles.pillChipTextActive,
                            ]}>
                                $$
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
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
