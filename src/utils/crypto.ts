import { AUTH_CONFIG } from '@/config/auth';

/**
 * Utils Base64 ↔ Uint8Array
 */
const base64ToUint8 = (b64: string): Uint8Array =>
  Uint8Array.from(atob(b64), c => c.charCodeAt(0));

const uint8ToBase64 = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes));

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * Encrypt AES-256-GCM
 */
export const encryptAES256 = async (text: string): Promise<string> => {
  const keyBytes = base64ToUint8(AUTH_CONFIG.AES_SECRET_KEY); // 32 bytes
  const ivBytes  = base64ToUint8(AUTH_CONFIG.AES_IV);         // 12 bytes

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: ivBytes,
      tagLength: 128,
    },
    cryptoKey,
    encoder.encode(text)
  );

  return uint8ToBase64(new Uint8Array(encryptedBuffer));
};

/**
 * Decrypt AES-256-GCM
 */
export const decryptAES256 = async (encryptedBase64: string): Promise<string> => {
  const keyBytes = base64ToUint8(AUTH_CONFIG.AES_SECRET_KEY);
  const ivBytes  = base64ToUint8(AUTH_CONFIG.AES_IV);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBytes,
      tagLength: 128,
    },
    cryptoKey,
    base64ToUint8(encryptedBase64)
  );

  return decoder.decode(decryptedBuffer);
};
