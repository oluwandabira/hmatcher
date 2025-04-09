// crypto-utils.js

/**
 * Returns the correct subtle crypto context.
 * @function
 * @returns {SubtleCrypto}
 */
export const getSubtleCrypto = () => {
    if (typeof window !== 'undefined' && window.crypto?.subtle) {
      return window.crypto.subtle;
    } else if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
      return globalThis.crypto.subtle;
    } else if (typeof require !== 'undefined') {
      try {
        const { webcrypto } = require('crypto');
        return webcrypto.subtle;
      } catch (err) {
        throw new Error('SubtleCrypto not available in this environment.');
      }
    } else {
      throw new Error('SubtleCrypto not available in this environment.');
    }
  };
  
  const subtle = getSubtleCrypto();
  
  /**
   * Converts a hex string to a Uint8Array.
   * @param {string} hex
   * @returns {Uint8Array}
   */
  export function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes;
  }
  
  /**
   * Converts a Uint8Array to a hex string.
   * @param {Uint8Array} bytes
   * @returns {string}
   */
  export function bytesToHex(bytes) {
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  
  /**
   * Converts a string to a Uint8Array.
   * @param {string} str
   * @returns {Uint8Array}
   */
  export function stringToBytes(str) {
    return new TextEncoder().encode(str);
  }
  
  /**
   * Converts a Uint8Array to a string.
   * @param {Uint8Array} bytes
   * @returns {string}
   */
  export function bytesToString(bytes) {
    return new TextDecoder().decode(bytes);
  }
  
  /**
   * Derives a cryptographic key from a password and salt.
   * @param {string} password
   * @param {string} salt - Hexadecimal salt string
   * @returns {Promise<CryptoKey>}
   */
  export async function deriveKeyFromPassword(password, salt) {
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);
    const saltData = hexToBytes(salt);
  
    const baseKey = await subtle.importKey(
      'raw',
      passwordData,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
  
    return subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltData,
        iterations: 100000,
        hash: 'SHA-256',
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }
  
  /**
   * Encrypts a message using the user's name and keyword.
   * @param {string} name
   * @param {string} keyword
   * @param {string} message
   * @returns {Promise<{
   *   recipient: string,
   *   salt: string,
   *   iv: string,
   *   encryptedMessage: string
   * }>}
   */
  export async function encryptMessage(name, keyword, message) {
    name = name.toLowerCase();
    keyword = keyword.toLowerCase();
  
    const salt = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
    const iv = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
  
    const combinedPassword = name + keyword;
    const key = await deriveKeyFromPassword(combinedPassword, salt);
  
    const messageData = stringToBytes(message);
    const encryptedBuffer = await subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: hexToBytes(iv),
      },
      key,
      messageData
    );
  
    const encryptedMessage = bytesToHex(new Uint8Array(encryptedBuffer));
  
    return {
      recipient: name,
      salt,
      iv,
      encryptedMessage,
    };
  }
  
  /**
   * @typedef {Object} EncryptedMessageData
   * @property {string} salt - Hex string
   * @property {string} iv - Hex string
   * @property {string} encryptedMessage - Hex string
   */
  
  /**
   * Decrypts an encrypted message using the user's name and keyword.
   * @param {string} name
   * @param {string} keyword
   * @param {EncryptedMessageData} messageData
   * @returns {Promise<string>}
   */
  export async function decryptMessage(name, keyword, messageData) {
    name = name.toLowerCase();
    keyword = keyword.toLowerCase();
  
    const combinedPassword = name + keyword;
    const key = await deriveKeyFromPassword(combinedPassword, messageData.salt);
  
    const iv = hexToBytes(messageData.iv);
    const ciphertext = hexToBytes(messageData.encryptedMessage);
  
    const decryptedBuffer = await subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      ciphertext
    );
  
    return bytesToString(new Uint8Array(decryptedBuffer));
  }
  