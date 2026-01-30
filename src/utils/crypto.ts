import CryptoJS from 'crypto-js';
import { AUTH_CONFIG } from '@/config/auth';

/**
 * Encrypt text using AES-256
 */
export const encryptAES256 = (text: string): string => {
  const encrypted = CryptoJS.AES.encrypt(text, AUTH_CONFIG.AES_SECRET_KEY);
  return encrypted.toString();
};

/**
 * Decrypt AES-256 encrypted text
 */
export const decryptAES256 = (encryptedText: string): string => {
  const decrypted = CryptoJS.AES.decrypt(encryptedText, AUTH_CONFIG.AES_SECRET_KEY);
  return decrypted.toString(CryptoJS.enc.Utf8);
};

/**
 * Create a simple JWT-like token (mock implementation)
 */
export const createMockJWT = (payload: object): string => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Date.now();
  const exp = now + 8 * 60 * 60 * 1000; // 8 hours
  
  const fullPayload = {
    ...payload,
    iat: now,
    exp,
    iss: AUTH_CONFIG.JWT_ISSUER,
  };
  
  const headerBase64 = btoa(JSON.stringify(header));
  const payloadBase64 = btoa(JSON.stringify(fullPayload));
  
  // Create signature using HMAC-SHA256
  const signature = CryptoJS.HmacSHA256(
    `${headerBase64}.${payloadBase64}`,
    AUTH_CONFIG.JWT_SECRET
  ).toString(CryptoJS.enc.Base64);
  
  return `${headerBase64}.${payloadBase64}.${signature}`;
};

/**
 * Verify and decode a mock JWT token
 */
export const verifyMockJWT = (token: string): { valid: boolean; payload?: any } => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false };
    }
    
    const [headerBase64, payloadBase64, signature] = parts;
    
    // Verify signature
    const expectedSignature = CryptoJS.HmacSHA256(
      `${headerBase64}.${payloadBase64}`,
      AUTH_CONFIG.JWT_SECRET
    ).toString(CryptoJS.enc.Base64);
    
    if (signature !== expectedSignature) {
      return { valid: false };
    }
    
    // Decode payload
    const payload = JSON.parse(atob(payloadBase64));
    
    // Check expiration
    if (payload.exp && payload.exp < Date.now()) {
      return { valid: false };
    }
    
    return { valid: true, payload };
  } catch {
    return { valid: false };
  }
};
