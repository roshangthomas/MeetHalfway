import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { TravelMode } from '../types';
import { COLORS } from '../constants/colors';

interface TravelModePickerProps {
    selectedMode: TravelMode;
    onModeChange: (mode: TravelMode) => void;
}

export const TravelModePicker: React.FC<TravelModePickerProps> = ({
    selectedMode,
    onModeChange,
}) => {
    const modes: TravelMode[] = ['driving', 'walking', 'bicycling', 'transit'];

    return (
        <View style={styles.container}>
            {modes.map((mode) => (
                <TouchableOpacity
                    key={mode}
                    style={[
                        styles.modeButton,
                        selectedMode === mode && styles.selectedMode,
                    ]}
                    onPress={() => onModeChange(mode)}
                >
                    <Text
                        style={[
                            styles.modeText,
                            selectedMode === mode && styles.selectedModeText,
                        ]}
                    >
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
        marginBottom: 16,
        gap: 8,
    },
    modeButton: {
        flex: 1,
        backgroundColor: COLORS.SURFACE,
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.TEXT,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    selectedMode: {
        backgroundColor: COLORS.PRIMARY,
    },
    modeText: {
        fontSize: 13,
        color: COLORS.TEXT,
        textAlign: 'center',
    },
    selectedModeText: {
        color: COLORS.SURFACE,
        fontWeight: '600',
    },
}); 