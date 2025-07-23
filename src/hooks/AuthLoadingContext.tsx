import React, { createContext, useContext, useState, ReactNode } from "react";

interface AuthLoadingContextType {
  authLoadingShown: boolean;
  setAuthLoadingShown: (shown: boolean) => void;
}

const AuthLoadingContext = createContext<AuthLoadingContextType | undefined>(undefined);

export const AuthLoadingProvider = ({ children }: { children: ReactNode }) => {
  const [authLoadingShown, setAuthLoadingShown] = useState(false);
  return (
    <AuthLoadingContext.Provider value={{ authLoadingShown, setAuthLoadingShown }}>
      {children}
    </AuthLoadingContext.Provider>
  );
};

export function useAuthLoading() {
  const ctx = useContext(AuthLoadingContext);
  if (!ctx) throw new Error("useAuthLoading must be used within AuthLoadingProvider");
  return ctx;
} 