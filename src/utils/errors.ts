import axios, { AxiosError } from 'axios';
import { ERROR_MESSAGES } from '../constants';

interface GoogleApiErrorResponse {
    status?: string;
}

export function isAxiosError(error: unknown): error is AxiosError<GoogleApiErrorResponse> {
    return axios.isAxiosError(error);
}

export interface ApiError {
    message: string;
    code?: string;
    details?: unknown;
}

export function getErrorMessage(error: unknown, fallbackMessage: string): string {
    if (error instanceof Error) {
        return error.message;
    }
    return fallbackMessage;
}

export function isKnownErrorMessage(message: string): boolean {
    const knownMessages = Object.values(ERROR_MESSAGES);
    return knownMessages.includes(message as typeof knownMessages[number]);
}

export function createApiError(message: string, code?: string, details?: unknown): ApiError {
    return { message, code, details };
}

export function handleAxiosError(error: unknown): string {
    if (isAxiosError(error)) {
        if (error.response?.data?.status) {
            switch (error.response.data.status) {
                case 'OVER_QUERY_LIMIT':
                    return ERROR_MESSAGES.API_QUOTA_EXCEEDED;
                case 'REQUEST_DENIED':
                    return ERROR_MESSAGES.API_KEY_INVALID;
                case 'INVALID_REQUEST':
                    return ERROR_MESSAGES.GEOCODING_FAILED;
            }
        }

        if (!error.response && error.request) {
            return ERROR_MESSAGES.NETWORK_ERROR;
        }
    }

    return getErrorMessage(error, ERROR_MESSAGES.NETWORK_ERROR);
}
