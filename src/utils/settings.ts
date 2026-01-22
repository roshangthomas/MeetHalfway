import { Platform, Linking } from 'react-native';

export const openLocationSettings = (): void => {
    if (Platform.OS === 'ios') {
        Linking.openURL('app-settings:');
    } else {
        Linking.openSettings();
    }
};
