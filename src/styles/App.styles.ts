import { StyleSheet, Dimensions, Platform } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../constants';

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
        padding: SPACING.MEDIUM,
        paddingTop: SPACING.LARGE,
    },

    mapContainer: {
        height: height * 0.18,
        width: '100%',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        overflow: 'hidden',
    },
    map: {
        width: '100%',
        height: '100%',
    },
    mapLoadingContainer: {
        height: height * 0.18,
        width: '100%',
        backgroundColor: COLORS.GRAY_LIGHT,
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },

    routeCard: {
        backgroundColor: COLORS.SURFACE,
        borderRadius: 20,
        paddingVertical: 12,
        paddingHorizontal: SPACING.MEDIUM,
        shadowColor: COLORS.TEXT,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 4,
        zIndex: 998,
    },
    routeCardLoading: {
        opacity: 0.6,
    },
    routeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 50,
    },
    routeDotContainer: {
        width: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    routeDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 3,
        borderColor: COLORS.SURFACE,
        shadowColor: COLORS.TEXT,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    routeDotOrigin: {
        backgroundColor: COLORS.PRIMARY,
    },
    routeDotDestination: {
        backgroundColor: COLORS.SECONDARY,
    },
    routeConnector: {
        marginLeft: SPACING.MEDIUM,
        paddingVertical: SPACING.XS,
        alignItems: 'center',
        width: 0,
        gap: 5,
    },
    routeDotSmall: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: COLORS.GRAY_LIGHT,
    },
    routeLocationRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        backgroundColor: COLORS.BACKGROUND,
        borderRadius: BORDER_RADIUS.LARGE,
        marginLeft: SPACING.SMALL,
    },
    routeLocationText: {
        flex: 1,
        fontSize: 15,
        color: COLORS.TEXT,
        fontWeight: '500',
    },
    routeChangeText: {
        fontSize: FONT_SIZES.MEDIUM,
        color: COLORS.PRIMARY,
        fontWeight: '600',
        marginLeft: SPACING.SMALL,
    },
    routeInputArea: {
        flex: 1,
        marginLeft: SPACING.SMALL,
    },
    routeLoadingText: {
        fontSize: FONT_SIZES.MEDIUM,
        color: COLORS.GRAY,
        marginLeft: SPACING.SMALL,
    },
    routeInputPlaceholder: {
        flex: 1,
        height: 50,
        borderRadius: BORDER_RADIUS.LARGE,
        marginLeft: SPACING.SMALL,
    },

    preferencesSection: {
        marginTop: SPACING.LARGE,
    },

    findButtonContainer: {
        marginTop: SPACING.SMALL,
    },
    findButton: {
        backgroundColor: COLORS.PRIMARY,
        padding: SPACING.MEDIUM,
        borderRadius: 14,
        alignItems: 'center',
    },
    findButtonText: {
        color: COLORS.SURFACE,
        fontSize: 17,
        fontWeight: '700',
    },

    inputContainer: {
        marginBottom: 12,
        width: '100%',
        zIndex: 998,
        backgroundColor: COLORS.SURFACE,
        borderRadius: 20,
        padding: SPACING.MEDIUM,
        ...SHADOWS.MEDIUM,
        elevation: Platform.OS === 'android' ? 998 : 0,
    },
    error: {
        color: COLORS.ERROR,
        textAlign: 'center',
        marginTop: 12,
        marginBottom: 12,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    button: {
        backgroundColor: COLORS.PRIMARY,
        padding: 14,
        borderRadius: BORDER_RADIUS.LARGE,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 12,
    },
    buttonText: {
        color: COLORS.SURFACE,
        fontSize: FONT_SIZES.LARGE,
        fontWeight: '600',
    },
    label: {
        fontSize: FONT_SIZES.LARGE,
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
        fontSize: FONT_SIZES.LARGE,
        fontWeight: '600',
    },
    warningButton: {
        backgroundColor: COLORS.WARNING,
        marginTop: 6,
        marginBottom: 6,
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
        fontSize: FONT_SIZES.LARGE,
        fontWeight: '600',
    },
    headerBackButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    headerBackText: {
        color: COLORS.PRIMARY,
        fontSize: FONT_SIZES.LARGE,
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
        marginBottom: SPACING.MEDIUM,
        padding: SPACING.SMALL,
    },
    permissionTitle: {
        fontSize: FONT_SIZES.XL,
        fontWeight: '700',
        color: COLORS.TEXT,
        marginBottom: SPACING.SMALL,
        textAlign: 'center',
    },
    permissionText: {
        fontSize: FONT_SIZES.MEDIUM,
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
        borderRadius: BORDER_RADIUS.MEDIUM,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: COLORS.WARNING_BANNER_BORDER,
    },
    warningText: {
        flex: 1,
        marginLeft: SPACING.SMALL,
        fontSize: 13,
        color: COLORS.WARNING_BANNER_TEXT,
    },

    // --- Participant input group ---
    participantInputGroup: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: SPACING.SMALL,
        gap: 6,
    },
    participantLocationInput: {
        flex: 1,
    },
    removeParticipantButton: {
        padding: 4,
    },
    addParticipantButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        marginTop: SPACING.SMALL,
    },
    addParticipantText: {
        fontSize: 14,
        color: COLORS.PRIMARY,
        fontWeight: '600',
    },
});
