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
  const [user, setUser] = useState<UserPayload | null>(() => {
    if (initialUser) return initialUser;
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("nipponic.user");
        if (stored) return JSON.parse(stored);
      } catch {
        // Ignore localStorage read errors
      }
    }
    return null;
  });

  const [isWakingServer, setIsWakingServer] = useState<boolean>(() => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return false;
    }
    return !!initialUser;
  });

  const hasInitialToken = !!initialUser || !!user;

  const login = async (token: string) => {
    await saveAuthCookie(token);
    const decoded = jwtDecode<UserPayload>(token);
    setUser(decoded);
    try {
      localStorage.setItem("nipponic.user", JSON.stringify(decoded));
    } catch {
      // Ignore localStorage write errors
    }
    setIsWakingServer(false);
  };

  const logout = async () => {
    await removeAuthCookie();
    setUser(null);
    try {
      localStorage.removeItem("nipponic.user");
    } catch {
      // Ignore localStorage remove errors
    }
    setIsWakingServer(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isWakingServer,
        setIsWakingServer,
        hasInitialToken,
        login,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


export const useAuth = () => useContext(AuthContext);