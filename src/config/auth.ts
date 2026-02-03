// Authentication configuration
// Keys and secrets for authentication system

export const AUTH_CONFIG = {
  // AES-256 encryption configuration
  // IMPORTANT: These must match the backend configuration
  // Key must be exactly 32 bytes for AES-256
  // IV must be exactly 16 bytes for CBC mode
  AES_SECRET_KEY: 'rH9uRZ4sQKcA3nWn2v8xQ4cYt9ZzF1yB0Lk6xNw7m5E=', // Exactly 32 characters
  AES_IV: 'MDEyMzQ1Njc4OWFi', // Exactly 16 characters
  
  // JWT configuration (for reference, handled by backend)
  JWT_EXPIRATION: '1h',
  JWT_ISSUER: 'nca-userstndr-app',
  
  // Session configuration
  SESSION_STORAGE_KEY: 'nca_auth_session',
  TOKEN_STORAGE_KEY: 'nca_auth_token',
};

// Debug function to test encryption/decryption
export const testAESEncryption = (): { success: boolean; message: string } => {
  try {
    // Import dynamically to avoid circular dependency issues
    const CryptoJS = require('crypto-js');
    
    const testText = 'test_username_123';
    const key = CryptoJS.enc.Utf8.parse(AUTH_CONFIG.AES_SECRET_KEY);
    const iv = CryptoJS.enc.Utf8.parse(AUTH_CONFIG.AES_IV);
    
    // Encrypt
    const encrypted = CryptoJS.AES.encrypt(testText, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    const encryptedStr = encrypted.toString();
    
    // Decrypt
    const decrypted = CryptoJS.AES.decrypt(encryptedStr, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);
    
    // Validate
    if (decryptedStr === testText) {
      console.log('✅ AES-256-CBC Test PASSED');
      console.log('Original:', testText);
      console.log('Encrypted:', encryptedStr);
      console.log('Decrypted:', decryptedStr);
      console.log('Key length:', AUTH_CONFIG.AES_SECRET_KEY.length, 'bytes');
      console.log('IV length:', AUTH_CONFIG.AES_IV.length, 'bytes');
      return { success: true, message: 'Encryption test passed' };
    } else {
      console.error('❌ AES-256-CBC Test FAILED: Decrypted text does not match');
      return { success: false, message: 'Decrypted text does not match original' };
    }
  } catch (error) {
    console.error('❌ AES-256-CBC Test ERROR:', error);
    return { success: false, message: String(error) };
  }
};
