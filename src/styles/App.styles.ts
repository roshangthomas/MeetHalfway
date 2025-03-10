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
        paddingBottom: 32,
    },
    mapContainer: {
        width: '100%',
        height: height * 0.3,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    map: {
        width: '100%',
        height: '100%',
    },
    inputContainer: {
        width: '100%',
        gap: 16,
    },
    addressInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginBottom: 8,
    },
    removeAddressButton: {
        marginLeft: 8,
        padding: 4,
    },
    addAddressButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.SURFACE,
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: COLORS.PRIMARY_LIGHT,
        borderStyle: 'dashed',
    },
    addAddressButtonText: {
        color: COLORS.PRIMARY,
        fontSize: 16,
        fontWeight: '500',
    },
    button: {
        backgroundColor: COLORS.PRIMARY,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        backgroundColor: COLORS.GRAY,
    },
    buttonText: {
        color: COLORS.WHITE,
        fontSize: 16,
        fontWeight: '600',
    },
    error: {
        color: COLORS.ERROR,
        marginTop: 16,
        textAlign: 'center',
    },
}); 