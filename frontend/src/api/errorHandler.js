import { ApiError } from "./client";

export function getErrorMessage(error, fallbackMessage = 'Произошла непредвиденная ошибка') {
    if(!(error instanceof ApiError)) {
        return fallbackMessage;
    }

    if (error.payload?.message) {
    return error.payload.message;
    }

    return fallbackMessage;
}