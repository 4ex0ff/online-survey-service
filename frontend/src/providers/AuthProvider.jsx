import { useMemo, useState } from "react";

import { AuthContext } from "./AuthContext";

const AUTH_STORAGE_KEY = "survey-service-auth";

function loadStoredAuth() {
  // Восстанавливаем сессию после reload; некорректный JSON считаем состоянием без входа.
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
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
  // В MVP JWT хранится в localStorage; позже при необходимости можно перейти на httpOnly cookies.
  const [authState, setAuthState] = useState(loadStoredAuth);

  const signIn = (nextAuth) => {
    setAuthState(nextAuth);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuth));
  };

  const signOut = () => {
    setAuthState({ token: null, user: null });
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

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
