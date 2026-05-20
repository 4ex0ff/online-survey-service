import { useMemo, useState, useEffect } from "react";

import { AuthContext } from "./AuthContext";
import { setUnauthorizedHandler } from "../api/client";

const AUTH_STORAGE_KEY = "survey-service-auth";

function loadStoredAuth() {
  let raw = localStorage.getItem(AUTH_STORAGE_KEY);
  
  // Для разработки: если localStorage пуст, создаётся тестовый токен
  if (!raw && import.meta.env.DEV) {
    raw = JSON.stringify({
      token: 'dev-token-' + Math.random().toString(36).slice(2),
      user: { userID: 1, name: 'Developer', isAdmin: false }
    });
    localStorage.setItem(AUTH_STORAGE_KEY, raw);
    console.log('loadStoredAuth: created test token', raw);
  }
  
  if (!raw) {
    return { token: null, user: null };
  }

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(() => loadStoredAuth());

  const signIn = (nextAuth) => {
    setAuthState(nextAuth);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuth));
  };

  const signOut = () => {
    setAuthState({ token: null, user: null });
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  // Регистрируем глобальный обработчик для 401 ошибок
  useEffect(() => {
    setUnauthorizedHandler(() => {
      signOut();
    });
  }, []);

  const value = useMemo(
    () => ({
      ...authState,
      isAuthenticated: Boolean(authState.token && authState.user),
      signIn,
      signOut,
    }),
    [authState],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}