export const parseDurationToMinutes = (durationText: string): number => {
    if (!durationText || durationText === 'Unknown') return 9999;

    const matches = durationText.match(/(\d+)/g);
    if (!matches) return 9999;

    if (durationText.includes('hour') || durationText.includes('hr')) {
        const hours = parseInt(matches[0], 10) || 0;
        const minutes = matches.length > 1 ? parseInt(matches[1], 10) : 0;
        return (hours * 60) + minutes;
    }

    return parseInt(matches[0], 10) || 0;
};

export const formatMinutesToDuration = (minutes: number): string => {
    if (minutes < 60) {
        return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
        return `${hours} hr`;
    }

    return `${hours} hr ${remainingMinutes} min`;
};
