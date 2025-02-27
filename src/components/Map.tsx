import React, { useState, forwardRef, ForwardRefRenderFunction } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Location, Restaurant } from '../types';
import { COLORS } from '../constants/colors';

interface MapProps {
    userLocation: Location;
    partnerLocation?: Location | null;
    midpoint?: Location | null;
    restaurants: Restaurant[];
}

const MapComponent: ForwardRefRenderFunction<MapView, MapProps> = (props, ref) => {
    const [mapReady, setMapReady] = useState(false);

    return (
        <View style={styles.container}>
            <MapView
                ref={ref}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                    ...props.userLocation,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}
                onMapReady={() => setMapReady(true)}
                showsUserLocation={true}
                showsMyLocationButton={true}
            >
                {mapReady && (
                    <>
                        {/* User Location */}
                        <Marker
                            coordinate={props.userLocation}
                            title="Your Location"
                            pinColor="blue"
                        />

                        {/* Partner Location */}
                        {props.partnerLocation && (
                            <Marker
                                coordinate={props.partnerLocation}
                                title="Partner's Location"
                                pinColor="green"
                            />
                        )}

                        {/* Midpoint */}
                        {props.midpoint && (
                            <Marker
                                coordinate={props.midpoint}
                                title="Meeting Point"
                                pinColor="red"
                            />
                        )}

                        {/* Restaurants */}
                        {props.restaurants.map((restaurant) => (
                            <Marker
                                key={restaurant.id}
                                coordinate={{
                                    latitude: restaurant.latitude,
                                    longitude: restaurant.longitude,
                                }}
                                title={restaurant.name}
                                description={restaurant.address}
                            />
                        ))}
                    </>
                )}
            </MapView>
        </View>
    );
};

export const Map = forwardRef(MapComponent);

const styles = StyleSheet.create({
    container: {
        height: Dimensions.get('window').height * 0.45,
        width: '100%',
        marginTop: 0,
        marginBottom: 16,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: COLORS.TEXT,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    map: {
        position: "absolute",
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
    },
}); 