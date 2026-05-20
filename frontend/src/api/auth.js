import { request } from "./client";

export function registerUser(payload) {
  // Register creates the account; login still happens as a separate step in the MVP.
  return request("/api/auth/register", {
    method: "POST",
    body: payload,
  });
}

export function loginUser(payload) {
  // Login возвращает { token, user }, которые AuthProvider сохраняет как текущую сессию.
  return request("/api/auth/login", {
    method: "POST",
    body: payload,
  });
}

export function logoutUser(token) {
  // Logout — опциональный запрос на бэкенд, может быть пропущен если токен удаляется на клиенте
  if (!token) {
    return Promise.resolve();
  }
  return request("/api/auth/logout", {
    method: "POST",
    token,
  }).catch(err => {
    // Даже если logout эндпоинт недоступен, не блокируем выход
    console.error('Logout request error:', err);
  });
}