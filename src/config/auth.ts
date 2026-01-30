// Authentication configuration
// Keys and secrets for authentication system

export const AUTH_CONFIG = {
  // AES-256 encryption key (32 bytes for AES-256)
  //AES_SECRET_KEY: 'NCA-Transport-2024-SecureKey-256!',
  AES_SECRET_KEY: 'NCA-Appmobile-2024-SecureKey-256!',
  
  // JWT configuration
  //JWT_SECRET: 'NCA-JWT-SecretKey-2024-RouteApp!',
  JWT_SECRET: 'NCA-JWT-SecretKey-2024-AppUsers!',
  JWT_EXPIRATION: '1h', // Token expiration time
  JWT_ISSUER: 'nca-transport-app',
  JWT_ISSUER: 'nca-userstndr-app', // usuarios estandar

  
  // Session configuration
  SESSION_STORAGE_KEY: 'nca_auth_session',
  TOKEN_STORAGE_KEY: 'nca_auth_token',
};
