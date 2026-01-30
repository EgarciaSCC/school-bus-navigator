import { MOCK_USERS, MockUser } from '@/data/mockUsers';
import { encryptAES256, decryptAES256, createMockJWT, verifyMockJWT } from '@/utils/crypto';
import { AUTH_CONFIG } from '@/config/auth';

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: Omit<MockUser, 'password'>;
}

export interface AuthUser {
  id: string;
  username: string;
  role: 'driver' | 'admin' | 'parent';
  name: string;
  email: string;
}

/**
 * Simulates a login API request with encrypted credentials
 */
export const mockLoginRequest = async (
  username: string,
  password: string
): Promise<AuthResponse> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Encrypt credentials (in real scenario, this would happen before sending to server)
  const encryptedUsername = encryptAES256(username);
  const encryptedPassword = encryptAES256(password);
  
  console.log('Encrypted credentials:', {
    username: encryptedUsername,
    password: encryptedPassword,
  });
  
  // Simulate server-side decryption and validation
  const decryptedUsername = decryptAES256(encryptedUsername);
  const decryptedPassword = decryptAES256(encryptedPassword);
  
  // Find user in mock database
  const user = MOCK_USERS.find(
    u => u.username === decryptedUsername && u.password === decryptedPassword
  );
  
  if (!user) {
    return {
      success: false,
      message: 'Usuario o contraseña incorrectos',
    };
  }
  
  // Create JWT token
  const token = createMockJWT({
    sub: user.id,
    username: user.username,
    role: user.role,
    name: user.name,
    email: user.email,
  });
  
  // Return user data without password
  const { password: _, ...userWithoutPassword } = user;
  
  return {
    success: true,
    message: 'Inicio de sesión exitoso',
    token,
    user: userWithoutPassword,
  };
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
 * Remove stored authentication token
 */
export const removeToken = (): void => {
  localStorage.removeItem(AUTH_CONFIG.TOKEN_STORAGE_KEY);
  localStorage.removeItem(AUTH_CONFIG.SESSION_STORAGE_KEY);
};

/**
 * Validate stored token and return user if valid
 */
export const validateStoredSession = (): AuthUser | null => {
  const token = getStoredToken();
  if (!token) return null;
  
  const { valid, payload } = verifyMockJWT(token);
  if (!valid || !payload) return null;
  
  return {
    id: payload.sub,
    username: payload.username,
    role: payload.role,
    name: payload.name,
    email: payload.email,
  };
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
