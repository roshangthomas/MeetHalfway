import { useState, useCallback, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SAVED_KEY = 'meethalfway_saved_places';

export const useSavedPlaces = () => {
    const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
    const loaded = useRef(false);

    useEffect(() => {
        if (loaded.current) return;
        loaded.current = true;
        AsyncStorage.getItem(SAVED_KEY).then(json => {
            if (json) setSavedIds(new Set(JSON.parse(json)));
        });
    }, []);

    const toggleSaved = useCallback(async (id: string) => {
        setSavedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            AsyncStorage.setItem(SAVED_KEY, JSON.stringify([...next]));
            return next;
        });
    }, []);

    return { savedIds, toggleSaved };
};
