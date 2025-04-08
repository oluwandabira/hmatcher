// crypto-utils.js
/**
 * Returns the correct subtle crypto context.
 * @function
 * @returns {Crypto.SubtleCrypto}
 */
export const getSubtleCrypto = () => {
    if (typeof window !== 'undefined' && window.crypto?.subtle) {
      // Browser environment
      return window.crypto.subtle;
    } else if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
      // Node.js environment (v15+)
      return globalThis.crypto.subtle;
    } else if (typeof require !== 'undefined') {
      // Fallback for older Node.js versions using CommonJS
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

// Function to convert hex string to Uint8Array
export function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes;
}

// Function to convert Uint8Array to hex string
export function bytesToHex(bytes) {
    return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// Function to convert string to Uint8Array
export function stringToBytes(str) {
    return new TextEncoder().encode(str);
}

// Function to convert Uint8Array to string
export function bytesToString(bytes) {
    return new TextDecoder().decode(bytes);
}

// Function to derive key from password and salt
export async function deriveKeyFromPassword(password, salt) {
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);
    const saltData = hexToBytes(salt);
    
    // Import the password as a key
    const baseKey = await subtle.importKey(
        "raw",
        passwordData,
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );
    
    // Derive a key using PBKDF2
    return subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: saltData,
            iterations: 100000,
            hash: "SHA-256"
        },
        baseKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}


// FOR ADMINISTRATORS: Function to encrypt a message (for creating event files)
export async function encryptMessage(name, keyword, message) {
    name = name.toLowerCase();
    keyword = keyword.toLowerCase();
    // Generate random salt and IV
    const salt = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
    const iv = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
    
    // Combine name and password
    const combinedPassword = name + keyword;
    
    // Derive a key
    const key = await deriveKeyFromPassword(combinedPassword, salt);
    
    // Encrypt the message
    const messageData = stringToBytes(message);
    const encryptedBuffer = await subtle.encrypt(
        {
            name: "AES-GCM",
            iv: hexToBytes(iv)
        },
        key,
        messageData
    );
    
    // Convert encrypted data to hex string
    const encryptedMessage = bytesToHex(new Uint8Array(encryptedBuffer));
    
    // Return encrypted data and parameters needed for decryption
    return {
        recipient: name,
        salt: salt,
        iv: iv,
        encryptedMessage: encryptedMessage
    };
}

// Function to decrypt message
export async function decryptMessage(name, keyword, messageData) {
    name = name.toLowerCase();
    keyword = keyword.toLowerCase();
    // Create key from name + password
    const combinedPassword = name + keyword;
    
    // Derive a cryptographic key
    const key = await deriveKeyFromPassword(combinedPassword, messageData.salt);
    
    // Convert IV and ciphertext from hex
    const iv = hexToBytes(messageData.iv);
    const ciphertext = hexToBytes(messageData.encryptedMessage);
    
    // Decrypt the message
    const decryptedBuffer = await subtle.decrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        key,
        ciphertext
    );
    const message = bytesToString(new Uint8Array(decryptedBuffer))
    return message;
}

// Example of how to use the encrypt function:
/*
async function createTestData() {
    try {
        const encryptedData = await encryptMessage("john", "sunshine", "Hello John! Your secret cabin assignment is Cabin #12");
        console.log(encryptedData);
        // This would output an object that could be saved to a JSON file
    } catch (error) {
        console.error("Error creating test data:", error);
    }
}
*/