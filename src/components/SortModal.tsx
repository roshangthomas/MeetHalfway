import React from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    Platform,
    TouchableWithoutFeedback
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { SortOption } from '../types';

interface SortModalProps {
    visible: boolean;
    onClose: () => void;
    onApply: (sortOption: SortOption) => void;
    currentSortOption: SortOption;
}

export const SortModal: React.FC<SortModalProps> = ({
    visible,
    onClose,
    onApply,
    currentSortOption
}) => {
    const sortOptions: { value: SortOption; label: string; icon: keyof typeof FontAwesome.glyphMap }[] = [
        { value: 'distance', label: 'Distance (closest first)', icon: 'map-marker' },
        { value: 'rating', label: 'Rating (highest first)', icon: 'star' },
        { value: 'price', label: 'Price (lowest first)', icon: 'dollar' },
        { value: 'travelTimeDiff', label: 'Travel Time Difference (most equal first)', icon: 'clock-o' }
    ];

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <SafeAreaView style={styles.modalContainer}>
                    <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Sort By</Text>
                                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                    <FontAwesome name="times" size={24} color={COLORS.TEXT} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.optionsContainer}>
                                {sortOptions.map((option) => (
                                    <TouchableOpacity
                                        key={option.value}
                                        style={styles.optionItem}
                                        onPress={() => onApply(option.value)}
                                    >
                                        <View style={styles.optionContent}>
                                            <FontAwesome name={option.icon} size={20} color={COLORS.TEXT} style={styles.optionIcon} />
                                            <Text style={styles.optionLabel}>{option.label}</Text>
                                        </View>

                                        {currentSortOption === option.value && (
                                            <FontAwesome name="check" size={20} color={COLORS.PRIMARY} />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </SafeAreaView>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.BACKGROUND,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: Platform.OS === 'ios' ? 20 : 30,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.GRAY_LIGHT,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.TEXT,
    },
    closeButton: {
        padding: 5,
    },
    optionsContainer: {
        paddingVertical: 10,
    },
    optionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.GRAY_LIGHT,
    },
    optionContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    optionIcon: {
        marginRight: 12,
        width: 24,
        textAlign: 'center',
    },
    optionLabel: {
        fontSize: 16,
        color: COLORS.TEXT,
    },
}); 