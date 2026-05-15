import { useMemo, useState } from "react";

import { AuthContext } from "./AuthContext";

const AUTH_STORAGE_KEY = "survey-service-auth";

function loadStoredAuth() {
  let raw = localStorage.getItem(AUTH_STORAGE_KEY);
  
  // Для разработки: если localStorage пуст, создаём тестовый токен
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
  const [isLoading, setIsLoading] = useState(false);

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
      isLoading,
      signIn,
      signOut,
    }),
    [authState, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}