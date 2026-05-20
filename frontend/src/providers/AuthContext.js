import { createContext } from "react";

// Общий auth context используется через useAuth(), без прямого импорта React context.
export const AuthContext = createContext(null);
