import { StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '../constants';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.BACKGROUND,
    },
    content: {
        flex: 1,
    },
    // --- Pill chip filter/sort bar ---
    filterSortBar: {
        backgroundColor: COLORS.SURFACE,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.GRAY_LIGHT,
    },
    pillScrollContent: {
        paddingHorizontal: SPACING.MEDIUM,
        paddingVertical: 12,
        gap: SPACING.SMALL,
        flexDirection: 'row',
        alignItems: 'center',
    },
    pillChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: SPACING.SMALL,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.GRAY_LIGHT,
        backgroundColor: COLORS.SURFACE,
    },
    pillChipActive: {
        backgroundColor: COLORS.TEXT,
        borderColor: COLORS.TEXT,
    },
    pillChipText: {
        fontSize: FONT_SIZES.MEDIUM,
        fontWeight: '500',
        color: COLORS.TEXT,
    },
    pillChipTextActive: {
        color: COLORS.SURFACE,
    },
    // --- List ---
    listContainer: {
        flex: 1,
    },
    noResultsContainer: {
        padding: SPACING.LARGE,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: SPACING.MEDIUM,
        marginHorizontal: SPACING.MEDIUM,
    },
    noResultsText: {
        fontSize: FONT_SIZES.LARGE,
        color: COLORS.TEXT_SECONDARY,
        textAlign: 'center',
        lineHeight: 24,
    },
});
