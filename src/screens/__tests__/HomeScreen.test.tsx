import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import App from '../../../App';
import { getCurrentLocation, geocodeAddress, findOptimalMeetingPlaces } from '../../services/location';

// Mock the entire navigation structure
jest.mock('@react-navigation/native', () => {
    const actualNav = jest.requireActual('@react-navigation/native');
    return {
        ...actualNav,
        useNavigation: () => ({
            navigate: jest.fn(),
            setParams: jest.fn()
        }),
    };
});

const Stack = createStackNavigator();

describe('HomeScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly and loads user location', async () => {
        const { getByText, queryByText } = render(
            <NavigationContainer>
                <App />
            </NavigationContainer>
        );

        // Check that the app title is displayed
        expect(getByText('Meet Halfway')).toBeTruthy();

        // Wait for location to be loaded
        await waitFor(() => {
            expect(getCurrentLocation).toHaveBeenCalled();
            expect(queryByText('Your Location:')).toBeTruthy();
        });
    });

    it('shows error when location permission is denied', async () => {
        // Mock the location permission denial
        (getCurrentLocation as jest.Mock).mockRejectedValueOnce(
            new Error('Location permission denied')
        );

        const { findByText } = render(
            <NavigationContainer>
                <App />
            </NavigationContainer>
        );

        // Check that the error message is displayed
        const errorElement = await findByText(/Location permission denied/i);
        expect(errorElement).toBeTruthy();
    });

    it('handles partner address input correctly', async () => {
        const { getByPlaceholderText, getByText } = render(
            <NavigationContainer>
                <App />
            </NavigationContainer>
        );

        // Wait for the screen to load
        await waitFor(() => {
            expect(getByText('Your Location:')).toBeTruthy();
        });

        // Find and fill the partner location input
        const partnerInput = getByPlaceholderText("Enter partner's location...");
        fireEvent.changeText(partnerInput, 'Los Angeles, CA');

        expect(partnerInput.props.value).toBe('Los Angeles, CA');
    });

    it('searches for meeting places when the search button is pressed', async () => {
        const { getByPlaceholderText, getByText, findByText } = render(
            <NavigationContainer>
                <App />
            </NavigationContainer>
        );

        // Wait for the screen to load
        await waitFor(() => {
            expect(getByText('Your Location:')).toBeTruthy();
        });

        // Find and fill the partner location input
        const partnerInput = getByPlaceholderText("Enter partner's location...");
        fireEvent.changeText(partnerInput, 'Los Angeles, CA');

        // Press the search button
        const searchButton = getByText('Find Meeting Point & Places');
        fireEvent.press(searchButton);

        // Check that the findOptimalMeetingPlaces function was called
        await waitFor(() => {
            expect(findOptimalMeetingPlaces).toHaveBeenCalled();
        });
    });
}); 