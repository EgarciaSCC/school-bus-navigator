import { encryptAES256 } from '@/utils/crypto';
import { AUTH_CONFIG } from '@/config/auth';
import { API_ENDPOINTS, buildApiUrl } from '@/config/api';

// Types based on API_CONTRACTS.md
export interface AuthUser {
  id: string;
  username: string;
  role: 'driver' | 'admin' | 'parent';
  name: string;
  email: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: AuthUser;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

export interface ValidateResponse {
  valid: boolean;
  user?: AuthUser;
  message?: string;
}

/**
 * Login API request with encrypted credentials
 * Endpoint: POST /api/auth/login
 */
export const loginRequest = async (
  username: string,
  password: string
): Promise<LoginResponse> => {
  // Encrypt credentials before sending to server
  const encryptedUsername = encryptAES256(username);
  const encryptedPassword = encryptAES256(password);
  
  try {
    const response = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.LOGIN), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: encryptedUsername,
        password: encryptedPassword,
      }),
    });
    
    const data = await response.json();
    
    return {
      success: data.success,
      message: data.message,
      token: data.token,
      user: data.user,
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: 'Error de conexión con el servidor',
    };
  }
};

/**
 * Logout API request
 * Endpoint: POST /api/auth/logout
 */
export const logoutRequest = async (): Promise<LogoutResponse> => {
  const token = getStoredToken();
  
  if (!token) {
    return { success: true, message: 'No hay sesión activa' };
  }
  
  try {
    const response = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.LOGOUT), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Logout error:', error);
    // Even if API fails, we should clear local storage
    return { success: true, message: 'Sesión cerrada localmente' };
  }
};

/**
 * Validate session API request
 * Endpoint: GET /api/auth/validate
 */
export const validateSessionRequest = async (): Promise<ValidateResponse> => {
  const token = getStoredToken();
  
  if (!token) {
    return { valid: false, message: 'No hay token almacenado' };
  }
  
  try {
    const response = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.VALIDATE), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Validate session error:', error);
    return { valid: false, message: 'Error de conexión' };
  }
};

/**
 * Get stored authentication token
 */
export const getStoredToken = (): string | null => {
  return localStorage.getItem(AUTH_CONFIG.TOKEN_STORAGE_KEY);
};

/**
 * Store authentication token
 */
export const storeToken = (token: string): void => {
  localStorage.setItem(AUTH_CONFIG.TOKEN_STORAGE_KEY, token);
};

/**
 * Remove stored authentication token and session
 */
export const removeToken = (): void => {
  localStorage.removeItem(AUTH_CONFIG.TOKEN_STORAGE_KEY);
  localStorage.removeItem(AUTH_CONFIG.SESSION_STORAGE_KEY);
};

/**
 * Store user session
 */
export const storeSession = (user: AuthUser): void => {
  localStorage.setItem(AUTH_CONFIG.SESSION_STORAGE_KEY, JSON.stringify(user));
};

/**
 * Get stored user session
 */
export const getStoredSession = (): AuthUser | null => {
  const session = localStorage.getItem(AUTH_CONFIG.SESSION_STORAGE_KEY);
  if (!session) return null;
  
  try {
    return JSON.parse(session);
  } catch {
    return null;
  }
};
