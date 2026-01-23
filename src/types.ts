export type BarkLevel = "critical" | "active" | "timeSensitive" | "passive";

export interface BarkNotification {
  title?: string;
  subtitle?: string;
  body?: string;
  markdown?: string;
  level?: BarkLevel;
  volume?: number;
  badge?: number;
  sound?: string;
  icon?: string;
  image?: string;
  group?: string;
  url?: string;
  copy?: string;
  autoCopy?: boolean;
  call?: boolean;
  isArchive?: boolean;
  action?: "none";
  id?: string;
  delete?: boolean;
  ciphertext?: string;
}

export interface BarkPushOptions extends BarkNotification {
  deviceKey?: string;
}

export interface BarkBatchPushOptions extends BarkNotification {
  deviceKeys: string[];
}

export interface BarkClientOptions {
  baseUrl?: string;
  deviceKey?: string;
  timeoutMs?: number;
  fetch?: typeof fetch;
  headers?: Record<string, string>;
}

export interface BarkSuccessResponse {
  code: 200;
  message: string;
  timestamp?: number;
}

export interface BarkErrorResponse {
  code: 400 | 404 | 500;
  message: string;
  timestamp?: number;
}

export type BarkApiResponse = BarkSuccessResponse | BarkErrorResponse;

export interface BarkEncryptionConfig {
  algorithm: string;
  key: string;
  iv: string;
}

export interface BarkEncryptedPushOptions {
  deviceKey?: string;
  payload: BarkNotification;
  encryption: BarkEncryptionConfig;
}
