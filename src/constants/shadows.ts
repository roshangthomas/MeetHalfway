import { COLORS } from './colors';

export const SHADOWS = {
    SMALL: {
        shadowColor: COLORS.TEXT,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    MEDIUM: {
        shadowColor: COLORS.TEXT,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
} as const;
