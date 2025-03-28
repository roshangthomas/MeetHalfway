import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TravelModePicker } from '../TravelModePicker';

describe('TravelModePicker Component', () => {
    it('renders correctly with the selected mode', () => {
        const { getByText } = render(
            <TravelModePicker
                selectedMode="driving"
                onModeChange={jest.fn()}
            />
        );

        expect(getByText('Travel Mode:')).toBeTruthy();
    });

    it('calls onModeChange when a different mode is selected', () => {
        const mockOnModeChange = jest.fn();
        const { getByTestId } = render(
            <TravelModePicker
                selectedMode="driving"
                onModeChange={mockOnModeChange}
            />
        );

        // Assuming the component has buttons with testIDs like 'mode-walking', 'mode-transit', etc.
        fireEvent.press(getByTestId('mode-walking'));
        expect(mockOnModeChange).toHaveBeenCalledWith('walking');
    });

    it('visually indicates the selected mode', () => {
        const { getByTestId } = render(
            <TravelModePicker
                selectedMode="driving"
                onModeChange={jest.fn()}
            />
        );

        // Assuming the selected mode button has a different style that can be tested
        const drivingButton = getByTestId('mode-driving');
        expect(drivingButton.props.style).toMatchObject(
            expect.objectContaining({
                backgroundColor: expect.any(String) // The selected color
            })
        );
    });
}); 