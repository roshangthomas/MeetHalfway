import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TravelMode } from '../types';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../constants';

interface TravelModePickerProps {
    selectedMode: TravelMode;
    onModeChange: (mode: TravelMode) => void;
}

const MODE_CONFIG: Record<TravelMode, { icon: keyof typeof Ionicons.glyphMap; label: string }> = {
    driving: { icon: 'car-outline', label: 'Drive' },
    walking: { icon: 'walk-outline', label: 'Walk' },
    bicycling: { icon: 'bicycle-outline', label: 'Bike' },
    transit: { icon: 'train-outline', label: 'Transit' },
};

export const TravelModePicker: React.FC<TravelModePickerProps> = ({
    selectedMode,
    onModeChange,
}) => {
    const modes: TravelMode[] = ['driving', 'walking', 'bicycling', 'transit'];

    return (
        <View style={styles.container}>
            {modes.map((mode) => {
                const isSelected = selectedMode === mode;
                const config = MODE_CONFIG[mode];
                return (
                    <TouchableOpacity
                        key={mode}
                        style={[
                            styles.modeButton,
                            isSelected && styles.selectedMode,
                        ]}
                        onPress={() => onModeChange(mode)}
                    >
                        <Ionicons
                            name={isSelected ? config.icon.replace('-outline', '') as keyof typeof Ionicons.glyphMap : config.icon}
                            size={22}
                            color={isSelected ? COLORS.SURFACE : COLORS.TEXT}
                        />
                        <Text
                            style={[
                                styles.modeText,
                                isSelected && styles.selectedModeText,
                            ]}
                        >
                            {config.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
        marginBottom: SPACING.MEDIUM,
        gap: SPACING.SMALL,
    },
    modeButton: {
        flex: 1,
        backgroundColor: COLORS.SURFACE,
        paddingVertical: 10,
        paddingHorizontal: SPACING.SMALL,
        borderRadius: BORDER_RADIUS.LARGE,
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.SMALL,
        gap: SPACING.XS,
    },
    selectedMode: {
        backgroundColor: COLORS.PRIMARY,
    },
    modeText: {
        fontSize: 11,
        color: COLORS.TEXT,
        textAlign: 'center',
    },
    selectedModeText: {
        color: COLORS.SURFACE,
        fontWeight: '600',
    },
});
