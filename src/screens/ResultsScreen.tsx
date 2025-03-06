import React, { useState } from 'react';
import { View, ScrollView, SafeAreaView, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { RestaurantList } from '../components/RestaurantList';
import { Restaurant, Location, TravelMode } from '../types';
import { styles } from '../styles/Results.styles';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { COLORS } from '../constants/colors';

type ResultsScreenProps = NativeStackScreenProps<RootStackParamList, 'Results'>;

type SortOption = 'rating' | 'distance' | 'duration' | 'fairness' | 'optimal';

export const ResultsScreen: React.FC<ResultsScreenProps> = ({ route, navigation }) => {
    const { restaurants, userLocation, partnerLocation, midpointLocation, travelMode } = route.params;
    const [sortBy, setSortBy] = useState<SortOption>('optimal');
    const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>(restaurants);

    // Sort restaurants based on selected option
    const sortRestaurants = (option: SortOption) => {
        setSortBy(option);

        const sorted = [...restaurants].sort((a, b) => {
            if (option === 'rating') {
                return (b.rating || 0) - (a.rating || 0);
            } else if (option === 'distance') {
                // Convert distance strings like "2.5 mi" to numbers for sorting
                const distA = parseFloat(a.distance?.replace(/[^0-9.]/g, '') || '999');
                const distB = parseFloat(b.distance?.replace(/[^0-9.]/g, '') || '999');
                return distA - distB;
            } else if (option === 'duration') {
                // Convert duration strings like "15 mins" to numbers for sorting
                const durA = parseFloat(a.duration?.replace(/[^0-9.]/g, '') || '999');
                const durB = parseFloat(b.duration?.replace(/[^0-9.]/g, '') || '999');
                return durA - durB;
            } else if (option === 'fairness') {
                // Sort by time difference (lower is better)
                const diffA = a.timeDifference || 999;
                const diffB = b.timeDifference || 999;
                return diffA - diffB;
            } else if (option === 'optimal') {
                // Sort by the calculated optimal score (higher is better)
                const scoreA = a.score || 0;
                const scoreB = b.score || 0;
                return scoreB - scoreA;
            }
            return 0;
        });

        setFilteredRestaurants(sorted);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.content}>
                <View style={styles.sortContainer}>
                    <Text style={styles.sortLabel}>Sort by:</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.sortButtons}
                    >
                        <TouchableOpacity
                            style={[styles.sortButton, sortBy === 'optimal' && styles.sortButtonActive]}
                            onPress={() => sortRestaurants('optimal')}
                        >
                            <Text style={[styles.sortButtonText, sortBy === 'optimal' && styles.sortButtonTextActive]}>
                                Best Match
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.sortButton, sortBy === 'fairness' && styles.sortButtonActive]}
                            onPress={() => sortRestaurants('fairness')}
                        >
                            <Text style={[styles.sortButtonText, sortBy === 'fairness' && styles.sortButtonTextActive]}>
                                Most Fair
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.sortButton, sortBy === 'rating' && styles.sortButtonActive]}
                            onPress={() => sortRestaurants('rating')}
                        >
                            <Text style={[styles.sortButtonText, sortBy === 'rating' && styles.sortButtonTextActive]}>
                                Rating
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.sortButton, sortBy === 'duration' && styles.sortButtonActive]}
                            onPress={() => sortRestaurants('duration')}
                        >
                            <Text style={[styles.sortButtonText, sortBy === 'duration' && styles.sortButtonTextActive]}>
                                Travel Time
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                <View style={styles.listContainer}>
                    {filteredRestaurants.length === 0 ? (
                        <View style={styles.noResultsContainer}>
                            <Text style={styles.noResultsText}>
                                No places found in this area. Try adjusting your search criteria.
                            </Text>
                        </View>
                    ) : (
                        <RestaurantList
                            restaurants={filteredRestaurants}
                            userLocation={userLocation}
                            partnerLocation={partnerLocation}
                            travelMode={travelMode}
                        />
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}; 