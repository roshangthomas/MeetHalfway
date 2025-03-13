import React, { useState, useEffect, useMemo } from 'react';
import { View, ScrollView, SafeAreaView, Text, TouchableOpacity, ActivityIndicator, FlatList, Image } from 'react-native';
import { RestaurantList } from '../components/RestaurantList';
import { Restaurant, Location, TravelMode, SortOption, RootStackParamList } from '../types';
import { styles } from '../styles/Results.styles';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { COLORS } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { FilterModal, FilterOptions } from '../components/FilterModal';
import { FontAwesome } from '@expo/vector-icons';
import { SortModal } from '../components/SortModal';
import * as Font from 'expo-font';

// Import default category images
import restaurantImage from '../assets/images/resturant.jpg';
import barImage from '../assets/images/bar.jpg';
import coffeeImage from '../assets/images/coffee.jpg';
import parkImage from '../assets/images/park.jpg';
import shoppingImage from '../assets/images/shopping.jpg';
import moviesImage from '../assets/images/movies.png';

// Utility function to get default image based on place type
export const getDefaultImageForPlaceType = (types: string[] | undefined) => {
    if (!types || types.length === 0) return restaurantImage;

    // Check for specific place types and return corresponding images
    if (types.some(type => type.includes('restaurant') || type.includes('food'))) {
        return restaurantImage;
    } else if (types.some(type => type.includes('bar') || type.includes('pub'))) {
        return barImage;
    } else if (types.some(type => type.includes('cafe') || type.includes('coffee'))) {
        return coffeeImage;
    } else if (types.some(type => type.includes('park') || type.includes('garden'))) {
        return parkImage;
    } else if (types.some(type => type.includes('shop') || type.includes('store') || type.includes('mall'))) {
        return shoppingImage;
    } else if (types.some(type => type.includes('movie') || type.includes('cinema') || type.includes('theater'))) {
        return moviesImage;
    }

    // Default to restaurant image if no match
    return restaurantImage;
};

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
        cuisineTypes: []
    });

    // Load fonts
    useEffect(() => {
        async function loadFonts() {
            await Font.loadAsync({
                ...FontAwesome.font,
                ...Ionicons.font
            });
            setFontsLoaded(true);
        }
        loadFonts();
    }, []);

    // Extract all unique cuisine types from restaurants
    const availableCuisineTypes = useMemo(() => {
        const cuisineSet = new Set<string>();
        restaurants.forEach(restaurant => {
            if (restaurant.types) {
                restaurant.types.forEach(type => cuisineSet.add(type));
            }
        });
        return Array.from(cuisineSet);
    }, [restaurants]);

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

            // Filter by cuisine types
            if (filters.cuisineTypes.length > 0 &&
                (!restaurant.types || !restaurant.types.some(type => filters.cuisineTypes.includes(type)))) {
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
                    const aUserTime = a.durationA ? convertDurationToMinutes(a.durationA) : 0;
                    const aFriendTime = a.durationB ? convertDurationToMinutes(a.durationB) : 0;
                    const aDiff = Math.abs(aUserTime - aFriendTime);

                    const bUserTime = b.durationA ? convertDurationToMinutes(b.durationA) : 0;
                    const bFriendTime = b.durationB ? convertDurationToMinutes(b.durationB) : 0;
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

    // Helper function to convert duration strings like "15 mins" to minutes
    const convertDurationToMinutes = (duration: string): number => {
        const match = duration.match(/(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
    };

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
        if (filters.cuisineTypes.length > 0) count++;
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
            <ScrollView style={styles.content}>
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
                            <Text style={styles.filterIcon}>≡</Text>
                        </TouchableOpacity>

                        <View style={styles.verticalDivider} />

                        <TouchableOpacity
                            style={styles.filterSortButton}
                            onPress={() => setIsSortModalVisible(true)}
                        >
                            <Text style={styles.filterSortButtonText}>
                                Sort: {getSortOptionDisplayName()}
                            </Text>
                            <View style={styles.sortIconBox}>
                                <Text style={styles.sortIconText}>↕</Text>
                            </View>
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
            </ScrollView>

            <FilterModal
                visible={isFilterModalVisible}
                onClose={() => setIsFilterModalVisible(false)}
                onApply={handleApplyFilters}
                initialFilters={filters}
                availableCuisineTypes={availableCuisineTypes}
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