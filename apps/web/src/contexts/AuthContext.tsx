"use client";
import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";
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
  const [isWakingServer, setIsWakingServer] = useState<boolean>(!!initialUser);

  useEffect(() => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsWakingServer(false);
    }
    if (!initialUser && typeof window !== "undefined") {
      try {
        const storedToken = localStorage.getItem("nipponic.token");
        const storedUser = localStorage.getItem("nipponic.user");

        if (storedToken && storedUser) {
          // Re-sync cookie with backend in background
          saveAuthCookie(storedToken).catch(() => {});
          setUser(JSON.parse(storedUser));
        } else if (!storedToken) {
          // If there is no token, remove orphaned user to avoid phantom login state
          localStorage.removeItem("nipponic.user");
          setUser(null);
        }
      } catch {
        // Ignore localStorage read errors
      }
    }
  }, [initialUser]);

  const hasInitialToken = !!initialUser || !!user;

  const login = useCallback(async (token: string) => {
    await saveAuthCookie(token);
    const decoded = jwtDecode<UserPayload>(token);
    setUser(decoded);
    try {
      localStorage.setItem("nipponic.token", token);
      localStorage.setItem("nipponic.user", JSON.stringify(decoded));
    } catch {
      // Ignore localStorage write errors
    }
    setIsWakingServer(false);
  }, []);

  const logout = useCallback(async () => {
    await removeAuthCookie();
    setUser(null);
    try {
      localStorage.removeItem("nipponic.token");
      localStorage.removeItem("nipponic.user");
    } catch {
      // Ignore localStorage remove errors
    }
    setIsWakingServer(false);
  }, []);

  const contextValue = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isWakingServer,
      setIsWakingServer,
      hasInitialToken,
      login,
      logout,
      setUser,
    }),
    [user, isWakingServer, hasInitialToken, login, logout]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}


export const useAuth = () => useContext(AuthContext);