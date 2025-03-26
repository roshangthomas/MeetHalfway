import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { LocationInput } from '../LocationInput';

describe('LocationInput Component', () => {
    it('renders correctly with placeholder', () => {
        const { getByPlaceholderText } = render(
            <LocationInput
                value=""
                onChangeText={jest.fn()}
                placeholder="Test placeholder"
            />
        );

        expect(getByPlaceholderText('Test placeholder')).toBeTruthy();
    });

    it('calls onChangeText when text is entered', () => {
        const mockOnChangeText = jest.fn();
        const { getByPlaceholderText } = render(
            <LocationInput
                value=""
                onChangeText={mockOnChangeText}
                placeholder="Test placeholder"
            />
        );

        fireEvent.changeText(getByPlaceholderText('Test placeholder'), 'New Location');
        expect(mockOnChangeText).toHaveBeenCalledWith('New Location');
    });

    it('displays the provided value', () => {
        const { getByDisplayValue } = render(
            <LocationInput
                value="Test Location"
                onChangeText={jest.fn()}
                placeholder="Test placeholder"
            />
        );

        expect(getByDisplayValue('Test Location')).toBeTruthy();
    });

    it('calls onInputFocus when input is focused', () => {
        const mockOnInputFocus = jest.fn();
        const { getByPlaceholderText } = render(
            <LocationInput
                value=""
                onChangeText={jest.fn()}
                placeholder="Test placeholder"
                onInputFocus={mockOnInputFocus}
            />
        );

        fireEvent(getByPlaceholderText('Test placeholder'), 'focus');
        expect(mockOnInputFocus).toHaveBeenCalled();
    });
}); 