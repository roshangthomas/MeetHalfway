import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

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
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
        color: '#555',
    },
    suggestion: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    bulletPoints: {
        alignSelf: 'flex-start',
        marginBottom: 30,
    },
    bulletPoint: {
        fontSize: 16,
        marginBottom: 5,
        color: '#555',
    },
    button: {
        backgroundColor: '#4a90e2',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 8,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
}); 