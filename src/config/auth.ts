// Authentication configuration
// Keys and secrets for authentication system

export const AUTH_CONFIG = {
  // AES-256 encryption configuration
  // IMPORTANT: These must match the backend configuration
  AES_SECRET_KEY: 'NCA-Appmobile-2024-SecureKey-256!',
  AES_IV: 'NCA-IV-2024-1234', // 16 bytes IV for AES-256-CBC
  
  // JWT configuration (for reference, handled by backend)
  JWT_EXPIRATION: '1h',
  JWT_ISSUER: 'nca-userstndr-app',
  
  // Session configuration
  SESSION_STORAGE_KEY: 'nca_auth_session',
  TOKEN_STORAGE_KEY: 'nca_auth_token',
};
