import { useContext } from "react";

import { AuthContext } from "./AuthContext";

export function useAuth() {
  // Небольшая защита, чтобы auth-хуки явно падали при использовании вне AuthProvider.
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
