import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants';

type NoResultsScreenProps = NativeStackScreenProps<RootStackParamList, 'NoResults'>;

export const NoResultsScreen = ({ navigation, route }: NoResultsScreenProps) => {
    const { errorMessage } = route.params;

    const handleGoBack = () => {
        navigation.navigate('Home');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>No Results Found</Text>
                <Text style={styles.message}>{errorMessage || "No venues found near the midpoint."}</Text>
                <Text style={styles.suggestion}>Please try:</Text>
                <View style={styles.bulletPoints}>
                    <Text style={styles.bulletPoint}>• Selecting different venue categories</Text>
                    <Text style={styles.bulletPoint}>• Changing your travel mode</Text>
                    <Text style={styles.bulletPoint}>• Searching with different locations</Text>
                </View>
                <TouchableOpacity style={styles.button} onPress={handleGoBack}>
                    <Text style={styles.buttonText}>Return to Search</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.SURFACE,
    },
    content: {
        flex: 1,
        padding: SPACING.LARGE,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: FONT_SIZES.XXL,
        fontWeight: 'bold',
        marginBottom: SPACING.LARGE,
        textAlign: 'center',
    },
    message: {
        fontSize: FONT_SIZES.LARGE,
        textAlign: 'center',
        marginBottom: 20,
        color: COLORS.TEXT_SECONDARY,
    },
    suggestion: {
        fontSize: FONT_SIZES.LARGE,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    bulletPoints: {
        alignSelf: 'flex-start',
        marginBottom: 30,
    },
    bulletPoint: {
        fontSize: FONT_SIZES.LARGE,
        marginBottom: 5,
        color: COLORS.TEXT_SECONDARY,
    },
    button: {
        backgroundColor: COLORS.PRIMARY,
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: BORDER_RADIUS.MEDIUM,
    },
    buttonText: {
        color: COLORS.SURFACE,
        fontSize: FONT_SIZES.LARGE,
        fontWeight: 'bold',
    },
}); 