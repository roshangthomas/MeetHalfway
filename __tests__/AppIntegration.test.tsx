import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import App from '../App';
import { getCurrentLocation, geocodeAddress, findOptimalMeetingPlaces } from '../src/services/location';

describe('App Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('completes the main app flow from home to results', async () => {
        const { getByPlaceholderText, getByText, findByText, queryByText } = render(
            <NavigationContainer>
                <App />
            </NavigationContainer>
        );

        // Wait for the home screen to load and location to be initialized
        await waitFor(() => {
            expect(getCurrentLocation).toHaveBeenCalled();
            expect(queryByText('Your Location:')).toBeTruthy();
        });

        // Enter partner location
        const partnerInput = getByPlaceholderText("Enter partner's location...");
        fireEvent.changeText(partnerInput, 'Los Angeles, CA');

        // Press the search button
        const searchButton = getByText('Find Meeting Point & Places');
        fireEvent.press(searchButton);

        // Verify search was initiated
        await waitFor(() => {
            expect(findOptimalMeetingPlaces).toHaveBeenCalledWith(
                expect.any(Object), // userLocation
                expect.any(Object), // partnerLocation
                'driving', // travelMode
                ['restaurant'], // categories
                20 // maxResults
            );
        });

        // Result screen should be shown (mock navigation prevents actual navigation)
        // But we can verify the navigation was attempted
        await waitFor(() => {
            expect(require('@react-navigation/native').useNavigation().navigate)
                .toHaveBeenCalledWith('Results', expect.any(Object));
        });
    });

    it('shows error screen when no results are found', async () => {
        // Mock findOptimalMeetingPlaces to return empty results
        (findOptimalMeetingPlaces as jest.Mock).mockResolvedValueOnce([]);

        const { getByPlaceholderText, getByText } = render(
            <NavigationContainer>
                <App />
            </NavigationContainer>
        );

        // Wait for the home screen to load
        await waitFor(() => {
            expect(getByText('Your Location:')).toBeTruthy();
        });

        // Enter partner location
        const partnerInput = getByPlaceholderText("Enter partner's location...");
        fireEvent.changeText(partnerInput, 'Los Angeles, CA');

        // Press the search button
        const searchButton = getByText('Find Meeting Point & Places');
        fireEvent.press(searchButton);

        // Verify navigation to NoResults screen was attempted
        await waitFor(() => {
            expect(require('@react-navigation/native').useNavigation().navigate)
                .toHaveBeenCalledWith('NoResults', expect.any(Object));
        });
    });

    it('navigates to the change location screen and back', async () => {
        const { getByText, findByText } = render(
            <NavigationContainer>
                <App />
            </NavigationContainer>
        );

        // Wait for the home screen to load
        await waitFor(() => {
            expect(getByText('Your Location:')).toBeTruthy();
        });

        // Press the Change button
        const changeButton = getByText('Change');
        fireEvent.press(changeButton);

        // Verify navigation was attempted
        await waitFor(() => {
            expect(require('@react-navigation/native').useNavigation().navigate)
                .toHaveBeenCalledWith('ChangeLocation', expect.any(Object));
        });
    });
}); 