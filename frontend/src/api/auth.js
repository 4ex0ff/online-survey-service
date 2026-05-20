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
