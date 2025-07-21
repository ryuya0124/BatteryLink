import React, { createContext, useContext } from "react"
import { useAuth, AuthContextValue } from "./useAuth"

export interface AuthContextValueWithLoading extends AuthContextValue {
  authLoading: boolean
  setAutoUpdate: (enabled: boolean) => Promise<void>
}

const AuthContext = createContext<AuthContextValueWithLoading | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth()
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider")
  return ctx
} 