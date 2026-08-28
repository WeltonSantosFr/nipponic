"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import { saveAuthCookie, removeAuthCookie } from "../actions/auth";
import { jwtDecode } from "jwt-decode";

export interface UserPayload {
  sub: string;
  username: string;
  email: string;
}

interface AuthContextData {
  user: UserPayload | null;
  isAuthenticated: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

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