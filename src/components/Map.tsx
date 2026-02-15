import React, { useState, forwardRef, ForwardRefRenderFunction } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Location, Restaurant } from '../types';
import { COLORS, MAP_DELTAS, SPACING, BORDER_RADIUS } from '../constants';

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
                    latitudeDelta: MAP_DELTAS.LATITUDE,
                    longitudeDelta: MAP_DELTAS.LONGITUDE,
                }}
                onMapReady={() => setMapReady(true)}
                showsUserLocation={true}
                showsMyLocationButton={true}
            >
                {mapReady && (
                    <>
                        <Marker
                            coordinate={props.userLocation}
                            title="Your Location"
                            pinColor="blue"
                        />

                        {props.partnerLocation && (
                            <Marker
                                coordinate={props.partnerLocation}
                                title="Partner's Location"
                                pinColor="green"
                            />
                        )}

                        {props.midpoint && (
                            <Marker
                                coordinate={props.midpoint}
                                title="Meeting Point"
                                pinColor="red"
                            />
                        )}

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
        marginBottom: SPACING.MEDIUM,
        borderRadius: BORDER_RADIUS.XL,
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