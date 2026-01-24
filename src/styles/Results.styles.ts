import { StyleSheet } from 'react-native';
import { COLORS } from '../constants';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.BACKGROUND,
    },
    content: {
        flex: 1,
    },
    // Filter and sort bar styles
    filterSortBar: {
        backgroundColor: COLORS.SURFACE,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.GRAY_LIGHT,
        width: '100%',
    },
    filterSortButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    filterSortButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 8,
    },
    filterSortButtonText: {
        fontSize: 20,
        fontWeight: '500',
        color: COLORS.TEXT,
        marginRight: 8,
    },
    sortIconBox: {
        width: 36,
        height: 36,
        backgroundColor: COLORS.SKELETON,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    sortIconText: {
        fontSize: 20,
        color: COLORS.TEXT,
        fontWeight: '600',
    },
    verticalDivider: {
        width: 1,
        height: '70%',
        backgroundColor: COLORS.GRAY_LIGHT,
        marginHorizontal: 8,
    },
    // List container styles
    listContainer: {
        flex: 1,
        marginTop: 8,
    },
    noResultsContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.SURFACE,
        borderRadius: 8,
        marginVertical: 16,
        marginHorizontal: 16,
        shadowColor: COLORS.BLACK,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    noResultsText: {
        fontSize: 16,
        color: COLORS.TEXT_SECONDARY,
        textAlign: 'center',
        lineHeight: 24,
    },
}); 