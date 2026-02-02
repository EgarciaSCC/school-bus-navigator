import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  AuthUser,
  loginRequest,
  logoutRequest,
  validateSessionRequest,
  storeToken,
  storeSession,
  removeToken,
  getStoredSession,
} from '@/services/authService';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const validateSession = async () => {
      // First check if we have a stored session
      const storedUser = getStoredSession();
      
      if (storedUser) {
        // Validate the session with the backend
        const response = await validateSessionRequest();
        
        if (response.valid && response.user) {
          setUser(response.user);
          // Update stored session with fresh data
          storeSession(response.user);
        } else {
          // Session is invalid, clear local storage
          removeToken();
          setUser(null);
        }
      }
      
      setIsLoading(false);
    };
    
    validateSession();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    
    try {
      const response = await loginRequest(username, password);
      
      if (response.success && response.token && response.user) {
        storeToken(response.token);
        storeSession(response.user);
        setUser(response.user);
      }
      
      setIsLoading(false);
      return { success: response.success, message: response.message };
    } catch (error) {
      setIsLoading(false);
      return { success: false, message: 'Error de conexión' };
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Call logout endpoint to invalidate token on server
      await logoutRequest();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Always clear local storage and state
      removeToken();
      setUser(null);
      setIsLoading(false);
    }
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
