import { StyleSheet, Dimensions, Platform } from 'react-native';
import { COLORS } from '../constants/colors';

const { width, height } = Dimensions.get('window');

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.BACKGROUND,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 16,
        paddingTop: 20,
    },
    mapContainer: {
        width: '100%',
        height: height * 0.3,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 20,
    },
    map: {
        width: '100%',
        height: '100%',
    },
    inputContainer: {
        marginBottom: 20,
        width: '100%',
        zIndex: 998,
        elevation: Platform.OS === 'android' ? 998 : 0,
        backgroundColor: COLORS.SURFACE,
        borderRadius: 24,
        padding: 20,
        shadowColor: COLORS.TEXT,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    travelModeContainer: {
        marginTop: 16,
    },
    button: {
        backgroundColor: COLORS.PRIMARY,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 12,
        marginBottom: 16,
    },
    buttonText: {
        color: COLORS.SURFACE,
        fontSize: 16,
        fontWeight: '600',
    },
    error: {
        color: COLORS.ERROR,
        textAlign: 'center',
        marginBottom: 16,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: COLORS.TEXT,
    },
    secondaryButton: {
        backgroundColor: COLORS.SURFACE,
        borderWidth: 1,
        borderColor: COLORS.PRIMARY,
        marginTop: 8,
    },
    secondaryButtonText: {
        color: COLORS.PRIMARY,
        fontSize: 16,
        fontWeight: '600',
    },
    warningButton: {
        backgroundColor: COLORS.WARNING,
        marginTop: 8,
        marginBottom: 8,
    },
}); 