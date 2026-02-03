import CryptoJS from 'crypto-js';
import { AUTH_CONFIG } from '@/config/auth';

/**
 * Encrypt text using AES-256-GCM with IV
 * This matches the backend encryption configuration
 */

const base64ToUint8 = (b64: string): Uint8Array =>
  Uint8Array.from(atob(b64), c => c.charCodeAt(0));

export const encryptAES256 = async (text: string): Promise<string> => {
  const keyBytes = base64ToUint8(AUTH_CONFIG.AES_SECRET_KEY);
  const ivBytes  = base64ToUint8(AUTH_CONFIG.AES_IV);
console.log(keyBytes);
  console.log(ivBytes);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: ivBytes,
      tagLength: 128,
    },
    cryptoKey,
    new TextEncoder().encode(text)
  );

  return btoa(
    String.fromCharCode(...new Uint8Array(encrypted))
  );
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
