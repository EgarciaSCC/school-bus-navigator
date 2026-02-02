import CryptoJS from 'crypto-js';
import { AUTH_CONFIG } from '@/config/auth';

/**
 * Encrypt text using AES-256-CBC with IV
 * This matches the backend encryption configuration
 */
export const encryptAES256 = (text: string): string => {
  const key = CryptoJS.enc.Utf8.parse(AUTH_CONFIG.AES_SECRET_KEY);
  const iv = CryptoJS.enc.Utf8.parse(AUTH_CONFIG.AES_IV);
  
  const encrypted = CryptoJS.AES.encrypt(text, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  
  return encrypted.toString();
};

/**
 * Decrypt AES-256-CBC encrypted text
 */
export const decryptAES256 = (encryptedText: string): string => {
  const key = CryptoJS.enc.Utf8.parse(AUTH_CONFIG.AES_SECRET_KEY);
  const iv = CryptoJS.enc.Utf8.parse(AUTH_CONFIG.AES_IV);
  
  const decrypted = CryptoJS.AES.decrypt(encryptedText, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  
  return decrypted.toString(CryptoJS.enc.Utf8);
};
