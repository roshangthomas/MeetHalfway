export function convertTimeToMinutes(timeStr: string): number {
    const cleanTimeStr = timeStr.trim().toUpperCase();
    const [hourMin, period] = cleanTimeStr.split(/\s+/);
    const [hours, minutes] = hourMin.split(':').map(Number);

    let totalHours = hours;
    if (period === 'PM' && hours < 12) {
        totalHours += 12;
    } else if (period === 'AM' && hours === 12) {
        totalHours = 0;
    }

    return totalHours * 60 + minutes;
}

export function getGoogleDayIndex(jsDayOfWeek: number): number {
    return jsDayOfWeek === 0 ? 6 : jsDayOfWeek - 1;
}

export function parseBusinessHours(hoursString: string): {
    day: string;
    openTime: string;
    closeTime: string;
} | null {
    if (!hoursString || hoursString.includes('Closed')) {
        return null;
    }

    const colonIndex = hoursString.indexOf(':');
    if (colonIndex === -1) return null;

    const day = hoursString.substring(0, colonIndex).trim();
    const hoursMatch = hoursString.match(/(\d+:\d+\s*(?:AM|PM))\s*–\s*(\d+:\d+\s*(?:AM|PM))/i);

    if (!hoursMatch) return null;

    return {
        day,
        openTime: hoursMatch[1],
        closeTime: hoursMatch[2],
    };
}

export function isBusinessOpen(businessHours: string[] | undefined): boolean | null {
    if (!businessHours || businessHours.length === 0) {
        return null;
    }

    const now = new Date();
    const dayOfWeek = now.getDay();
    const googleDayIndex = getGoogleDayIndex(dayOfWeek);

    const todayHours = businessHours[googleDayIndex];
    if (!todayHours || todayHours.includes('Closed')) {
        return false;
    }

    const parsed = parseBusinessHours(todayHours);
    if (!parsed) return null;

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const openMinutes = convertTimeToMinutes(parsed.openTime);
    const closeMinutes = convertTimeToMinutes(parsed.closeTime);

    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
}

export function getTodayHours(businessHours: string[] | undefined): string {
    if (!businessHours || businessHours.length === 0) {
        return 'Hours not available';
    }

    const dayOfWeek = new Date().getDay();
    const googleDayIndex = getGoogleDayIndex(dayOfWeek);

    const todayHours = businessHours[googleDayIndex];
    if (!todayHours) return 'Hours not available';

    const colonIndex = todayHours.indexOf(':');
    if (colonIndex !== -1) {
        return todayHours.substring(colonIndex + 1).trim();
    }

    return todayHours;
}
