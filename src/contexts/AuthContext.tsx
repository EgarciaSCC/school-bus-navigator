import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  AuthUser,
  mockLoginRequest,
  validateStoredSession,
  storeToken,
  storeSession,
  removeToken,
} from '@/services/authService';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = validateStoredSession();
    if (storedUser) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    
    try {
      const response = await mockLoginRequest(username, password);
      
      if (response.success && response.token && response.user) {
        storeToken(response.token);
        const authUser: AuthUser = {
          id: response.user.id,
          username: response.user.username,
          role: response.user.role,
          name: response.user.name,
          email: response.user.email,
        };
        storeSession(authUser);
        setUser(authUser);
      }
      
      setIsLoading(false);
      return { success: response.success, message: response.message };
    } catch (error) {
      setIsLoading(false);
      return { success: false, message: 'Error de conexión' };
    }
  }, []);

  const logout = useCallback(() => {
    removeToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
