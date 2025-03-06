import { StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.BACKGROUND,
    },
    content: {
        flex: 1,
        paddingTop: 16,
    },
    sortContainer: {
        marginBottom: 16,
        backgroundColor: COLORS.SURFACE,
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        marginHorizontal: 16,
    },
    sortLabel: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
        color: COLORS.TEXT,
    },
    sortButtons: {
        flexDirection: 'row',
        flexWrap: 'nowrap', // Prevent wrapping
    },
    sortButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 24,
        backgroundColor: COLORS.GRAY_LIGHT,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10, // Add spacing between buttons
    },
    sortButtonActive: {
        backgroundColor: COLORS.PRIMARY,
    },
    sortButtonText: {
        fontSize: 16,
        color: COLORS.TEXT,
    },
    sortButtonTextActive: {
        color: COLORS.SURFACE,
        fontWeight: '600',
    },
    listContainer: {
        flex: 1,
    },
    noResultsContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.SURFACE,
        borderRadius: 8,
        marginVertical: 16,
        marginHorizontal: 16,
        shadowColor: '#000',
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