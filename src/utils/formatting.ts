export const formatAddressForDisplay = (address: string | null): string => {
    if (!address) return 'Current Location';

    const parts = address.split(',').map(part => part.trim());

    if (parts.length >= 3) {
        return parts.slice(Math.max(0, parts.length - 3)).join(', ');
    }

    return address;
};

export const formatPlaceType = (type: string): string => {
    return type
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};
