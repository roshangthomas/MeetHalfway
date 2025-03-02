import React from 'react';
import { View, ScrollView, SafeAreaView } from 'react-native';
import { RestaurantList } from '../components/RestaurantList';
import { Map } from '../components/Map';
import { Restaurant, Location, TravelMode } from '../types';
import { styles } from '../styles/Results.styles';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type ResultsScreenProps = NativeStackScreenProps<RootStackParamList, 'Results'>;

export const ResultsScreen: React.FC<ResultsScreenProps> = ({ route, navigation }) => {
    const { restaurants, userLocation, partnerLocation, midpointLocation, travelMode } = route.params;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.content}>
                    <Map
                        userLocation={userLocation}
                        partnerLocation={partnerLocation}
                        midpoint={midpointLocation}
                        restaurants={restaurants}
                    />
                    <RestaurantList
                        restaurants={restaurants}
                        userLocation={userLocation}
                        travelMode={travelMode}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}; 