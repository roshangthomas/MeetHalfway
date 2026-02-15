const MAX_PRICE_LEVEL = 4;

export function renderPriceLevelText(priceLevel: number | undefined): string {
    if (!priceLevel || priceLevel <= 0) return '';
    const level = Math.min(priceLevel, MAX_PRICE_LEVEL);
    return '$'.repeat(level);
}

export function getPriceLevelDisplay(priceLevel: number | undefined): {
    filled: string;
    unfilled: string;
} {
    if (!priceLevel || priceLevel <= 0) {
        return { filled: '', unfilled: '' };
    }

    const level = Math.min(priceLevel, MAX_PRICE_LEVEL);
    return {
        filled: '$'.repeat(level),
        unfilled: '$'.repeat(MAX_PRICE_LEVEL - level),
    };
}

export function getPriceLevelDescription(priceLevel: number | undefined): string {
    if (!priceLevel || priceLevel <= 0) return 'Unknown';

    switch (priceLevel) {
        case 1:
            return 'Budget-friendly';
        case 2:
            return 'Moderate';
        case 3:
            return 'Pricey';
        case 4:
            return 'Expensive';
        default:
            return 'Unknown';
    }
}
