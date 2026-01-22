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
        padding: 12,
        paddingTop: 12,
    },
    mapContainer: {
        width: '100%',
        height: height * 0.25,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 12,
    },
    map: {
        width: '100%',
        height: '100%',
    },
    inputContainer: {
        marginBottom: 12,
        width: '100%',
        zIndex: 998,
        elevation: Platform.OS === 'android' ? 998 : 0,
        backgroundColor: COLORS.SURFACE,
        borderRadius: 20,
        padding: 16,
        shadowColor: COLORS.TEXT,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    travelModeContainer: {
        marginTop: 12,
    },
    button: {
        backgroundColor: COLORS.PRIMARY,
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 12,
    },
    buttonText: {
        color: COLORS.SURFACE,
        fontSize: 16,
        fontWeight: '600',
    },
    error: {
        color: COLORS.ERROR,
        textAlign: 'center',
        marginBottom: 12,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 6,
        color: COLORS.TEXT,
    },
    secondaryButton: {
        backgroundColor: COLORS.SURFACE,
        borderWidth: 1,
        borderColor: COLORS.PRIMARY,
        marginTop: 6,
    },
    secondaryButtonText: {
        color: COLORS.PRIMARY,
        fontSize: 16,
        fontWeight: '600',
    },
    warningButton: {
        backgroundColor: COLORS.WARNING,
        marginTop: 6,
        marginBottom: 6,
    },
    userLocationContainer: {
        marginBottom: 14,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.GRAY_LIGHT,
    },
    locationText: {
        fontSize: 16,
        color: COLORS.TEXT,
        marginBottom: 4,
        fontWeight: '500',
        flex: 1,
        marginRight: 8,
    },
    locationInfoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    changeLocationButton: {
        padding: 6,
        marginTop: 0,
        marginBottom: 0,
        minWidth: 80,
    },
    findButtonContainer: {
        marginTop: 8,
    },
    findButton: {
        backgroundColor: COLORS.PRIMARY,
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 4,
        marginBottom: 4,
    },
    findButtonText: {
        color: COLORS.SURFACE,
        fontSize: 16,
        fontWeight: '700',
    },
    scrollIndicator: {
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 4,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    scrollIndicatorText: {
        fontSize: 14,
        color: COLORS.PRIMARY,
        marginLeft: 4,
        fontStyle: 'italic',
    },
    buttonGroup: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 6,
    },
    cancelButton: {
        backgroundColor: COLORS.GRAY,
        borderWidth: 0,
        marginLeft: 10,
        flex: 1,
    },
    cancelButtonText: {
        color: COLORS.SURFACE,
        fontSize: 16,
        fontWeight: '600',
    },
    headerBackButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    headerBackText: {
        color: COLORS.PRIMARY,
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 2,
    },
    keyboardAvoidingContainer: {
        flex: 1,
    },
    scrollViewContent: {
        flexGrow: 1,
    },
    permissionMessageContainer: {
        marginBottom: 16,
        padding: 8,
    },
    permissionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.TEXT,
        marginBottom: 8,
        textAlign: 'center',
    },
    permissionText: {
        fontSize: 14,
        color: COLORS.TEXT,
        marginBottom: 12,
        textAlign: 'center',
        lineHeight: 20,
    },
    warningBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.WARNING_BANNER_BG,
        padding: 10,
        borderRadius: 8,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: COLORS.WARNING_BANNER_BORDER,
    },
    warningText: {
        flex: 1,
        marginLeft: 8,
        fontSize: 13,
        color: COLORS.WARNING_BANNER_TEXT,
    },
}); 