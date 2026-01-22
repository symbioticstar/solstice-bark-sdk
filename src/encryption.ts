import { BarkClientError } from "./errors.js";
import type { BarkEncryptionConfig, BarkNotification } from "./types.js";

const encoder = new TextEncoder();

const algorithmLengths: Record<BarkEncryptionConfig["algorithm"], number> = {
  "aes-128-cbc": 128,
  "aes-192-cbc": 192,
  "aes-256-cbc": 256,
};

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
  const expectedLength = algorithmLengths[config.algorithm];

  if (keyBytes.length * 8 !== expectedLength) {
    throw new BarkClientError(
      "Encryption key length does not match algorithm.",
      {
        code: "E_ENCRYPTION_INVALID_KEY",
      },
    );
  }

  if (ivBytes.length !== 16) {
    throw new BarkClientError("Encryption iv must be 16 bytes.", {
      code: "E_ENCRYPTION_INVALID_IV",
    });
  }

  const cryptoKey = await subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-CBC", length: expectedLength },
    false,
    ["encrypt"],
  );

  const data = encoder.encode(JSON.stringify(payload));
  const encrypted = await subtle.encrypt(
    { name: "AES-CBC", iv: ivBytes },
    cryptoKey,
    data,
  );
  return toBase64(encrypted);
};
