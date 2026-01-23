import { BarkClientError } from "./errors.js";
import type { BarkEncryptionConfig, BarkNotification } from "./types.js";

const encoder = new TextEncoder();

type NodeBufferLike = {
  from(data: Uint8Array): { toString(encoding: "base64"): string };
};

const toBase64 = (data: ArrayBuffer): string => {
  const bytes = new Uint8Array(data);
  const bufferCtor = (globalThis as { Buffer?: NodeBufferLike }).Buffer;

  if (bufferCtor) {
    return bufferCtor.from(bytes).toString("base64");
  }

  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
};

export const encryptPayload = async (
  payload: Record<string, unknown> | BarkNotification,
  config: BarkEncryptionConfig,
): Promise<string> => {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new BarkClientError(
      "Web Crypto API is not available in this runtime.",
      {
        code: "E_ENCRYPTION_UNAVAILABLE",
      },
    );
  }

  const keyBytes = encoder.encode(config.key);
  const ivBytes = encoder.encode(config.iv);

  // AES-128-GCM requires 16-byte (128-bit) key
  if (keyBytes.length !== 16) {
    throw new BarkClientError(
      "Encryption key must be 16 bytes for AES-128-GCM.",
      {
        code: "E_ENCRYPTION_INVALID_KEY",
      },
    );
  }

  const cryptoKey = await subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM", length: 128 },
    false,
    ["encrypt"],
  );

  const data = encoder.encode(JSON.stringify(payload));
  const encrypted = await subtle.encrypt(
    { name: "AES-GCM", iv: ivBytes },
    cryptoKey,
    data,
  );

  return toBase64(encrypted);
};
