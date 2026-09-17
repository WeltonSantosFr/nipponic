"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import { saveAuthCookie, removeAuthCookie } from "../actions/auth";
import { jwtDecode } from "jwt-decode";
import type { UserPayload, AuthContextData } from "@nipponic/shared";

export type { UserPayload, AuthContextData };

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ 
  children, 
  initialUser 
}: { 
  children: ReactNode; 
  initialUser: UserPayload | null 
}) {
  const [user, setUser] = useState<UserPayload | null>(initialUser);

  const login = async (token: string) => {
    await saveAuthCookie(token);
    setUser(jwtDecode<UserPayload>(token));
  };

  const logout = async () => {
    await removeAuthCookie();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);