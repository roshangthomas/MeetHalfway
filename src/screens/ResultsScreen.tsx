import React, { useState } from 'react';
import { View, ScrollView, SafeAreaView, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { RestaurantList } from '../components/RestaurantList';
import { Map } from '../components/Map';
import { Restaurant, Location, TravelMode } from '../types';
import { styles } from '../styles/Results.styles';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type ResultsScreenProps = NativeStackScreenProps<RootStackParamList, 'Results'>;

type SortOption = 'rating' | 'distance' | 'duration';

export const ResultsScreen: React.FC<ResultsScreenProps> = ({ route, navigation }) => {
    const { restaurants, userLocation, partnerLocation, midpointLocation, travelMode } = route.params;
    const [sortBy, setSortBy] = useState<SortOption>('rating');
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
            }
            return 0;
        });

        setFilteredRestaurants(sorted);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.content}>
                    <Map
                        userLocation={userLocation}
                        partnerLocation={partnerLocation}
                        midpoint={midpointLocation}
                        restaurants={filteredRestaurants}
                    />

                    <View style={styles.sortContainer}>
                        <Text style={styles.sortLabel}>Sort by:</Text>
                        <View style={styles.sortButtons}>
                            <TouchableOpacity
                                style={[styles.sortButton, sortBy === 'rating' && styles.sortButtonActive]}
                                onPress={() => sortRestaurants('rating')}
                            >
                                <Text style={[styles.sortButtonText, sortBy === 'rating' && styles.sortButtonTextActive]}>
                                    Rating
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.sortButton, sortBy === 'distance' && styles.sortButtonActive]}
                                onPress={() => sortRestaurants('distance')}
                            >
                                <Text style={[styles.sortButtonText, sortBy === 'distance' && styles.sortButtonTextActive]}>
                                    Distance
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
                        </View>
                    </View>

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
                            travelMode={travelMode}
                        />
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}; 