import React, { useState, forwardRef, ForwardRefRenderFunction } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Restaurant, Participant, Location } from '../types';
import { COLORS, MAP_DELTAS, SPACING, BORDER_RADIUS, PARTICIPANT_COLORS } from '../constants';

interface MapProps {
    participants: Participant[];
    midpoint?: Location | null;
    restaurants: Restaurant[];
}

const MapComponent: ForwardRefRenderFunction<MapView, MapProps> = (props, ref) => {
    const [mapReady, setMapReady] = useState(false);

    const firstLocation = props.participants[0]?.location;
    if (!firstLocation) return null;

    return (
        <View style={styles.container}>
            <MapView
                ref={ref}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                    ...firstLocation,
                    latitudeDelta: MAP_DELTAS.LATITUDE,
                    longitudeDelta: MAP_DELTAS.LONGITUDE,
                }}
                onMapReady={() => setMapReady(true)}
                showsUserLocation={true}
                showsMyLocationButton={true}
            >
                {mapReady && (
                    <>
                        {props.participants.map((p, i) => p.location && (
                            <Marker
                                key={`participant-${i}`}
                                coordinate={p.location}
                                title={p.name}
                                pinColor={PARTICIPANT_COLORS[i] || PARTICIPANT_COLORS[PARTICIPANT_COLORS.length - 1]}
                            />
                        ))}

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
