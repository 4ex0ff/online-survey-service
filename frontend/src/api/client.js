const JSON_HEADERS = {
  "Content-Type": "application/json",
};

// Все frontend API helpers используют этот тип ошибки, чтобы страницы показывали единые сообщения.
export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

// Глобальный обработчик для 401 ошибок (неавторизованный доступ)
let unauthorizedHandler = null;

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

export async function request(path, options = {}) {
  const { method = "GET", body, token } = options;
  const headers = {
    ...(body ? JSON_HEADERS : {}),
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const raw = await response.text();
  let payload = null;

  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    // Если 401, вызываем глобальный обработчик перед выбросом ошибки
    if (response.status === 401 && unauthorizedHandler) {
      unauthorizedHandler();
    }
    
    throw new ApiError(
      payload?.message || "Request failed",
      response.status,
      payload,
    );
  }

  return payload;
}