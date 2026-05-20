import { ApiError } from "./client";

const FIELD_LABELS = {
  email: "Email",
  name: "Имя",
  password: "Пароль",
};

function getValidationDetailMessage(detail) {
  // Backend возвращает детали валидации Pydantic; здесь они превращаются в понятные сообщения на русском.
  const field = detail?.loc?.[detail.loc.length - 1];
  const label = FIELD_LABELS[field];

  if (!field || !label) {
    return null;
  }

  if (field === "email") {
    return "Введите корректный email.";
  }

  if (detail?.type?.includes("too_short")) {
    if (field === "name") {
      return "Имя должно содержать минимум 2 символа.";
    }

    if (field === "password") {
      return "Пароль должен содержать минимум 8 символов.";
    }
  }

  if (detail?.type?.includes("too_long")) {
    return `${label} превышает допустимую длину.`;
  }

  return null;
}

export function getApiErrorMessage(error, fallbackMessage) {
  if (!(error instanceof ApiError)) {
    return fallbackMessage;
  }

  const detailMessage = error.payload?.details?.map(getValidationDetailMessage).find(Boolean);
  if (detailMessage) {
    return detailMessage;
  }

  return error.payload?.message || fallbackMessage;
}
