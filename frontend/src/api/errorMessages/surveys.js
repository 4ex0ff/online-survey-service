import { ApiError } from "../client";

export function getSurveyErrorMessage(error, fallbackMessage) {
  if (!(error instanceof ApiError)) {
    return fallbackMessage;
  }

  // Обработка ошибок валидации Pydantic от бэкенда
  if (error.payload?.details && Array.isArray(error.payload.details)) {
    const details = error.payload.details;
    
    // Ищем ошибку валидации для конкретного поля
    for (const detail of details) {
      const fieldPath = detail?.loc;
      if (!Array.isArray(fieldPath)) continue;
      
      const field = fieldPath[fieldPath.length - 1];
      
      if (field === 'title') {
        return 'Название опроса обязательно и должно быть не менее 4 символов.';
      }
      if (field === 'questions') {
        return 'Добавьте хотя бы один вопрос.';
      }
      if (field === 'closedAt') {
        return 'Дата закрытия не может быть в прошлом.';
      }
    }
  }

  // Общее сообщение об ошибке от бэкенда
  if (error.payload?.message) {
    return error.payload.message;
  }

  return fallbackMessage;
}
