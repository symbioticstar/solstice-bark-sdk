import { BarkClientError } from "./errors.js";
import { encryptPayload } from "./encryption.js";
import type {
  BarkApiResponse,
  BarkBatchPushOptions,
  BarkClientOptions,
  BarkEncryptedPushOptions,
  BarkPushOptions,
} from "./types.js";

const DEFAULT_BASE_URL = "https://api.day.app";

const normalizeBaseUrl = (baseUrl: string): string =>
  baseUrl.replace(/\/+$/, "");

const toFlag = (value?: boolean): "1" | "0" | undefined => {
  if (value === undefined) {
    return undefined;
  }
  return value ? "1" : "0";
};

export class BarkClient {
  readonly baseUrl: string;
  readonly deviceKey?: string;
  readonly timeoutMs?: number;

  #fetch: typeof fetch;
  #headers: Record<string, string>;

  constructor(options: BarkClientOptions = {}) {
    this.baseUrl = normalizeBaseUrl(options.baseUrl ?? DEFAULT_BASE_URL);
    this.deviceKey = options.deviceKey;
    this.timeoutMs = options.timeoutMs;
    this.#headers = { ...options.headers };

    const fetcher = options.fetch ?? globalThis.fetch;
    if (!fetcher) {
      throw new BarkClientError("Fetch API is not available in this runtime.", {
        code: "E_FETCH_UNAVAILABLE",
      });
    }
    this.#fetch = fetcher;
  }

  async push(options: BarkPushOptions): Promise<BarkApiResponse> {
    const payload = this.#buildPayload(options);
    if (!payload.device_key) {
      throw new BarkClientError("deviceKey is required for push.", {
        code: "E_MISSING_DEVICE_KEY",
      });
    }

    return this.#request<BarkApiResponse>("/push", payload, "POST");
  }

  async batchPush(options: BarkBatchPushOptions): Promise<BarkApiResponse> {
    const payload = this.#buildPayload(options);
    const deviceKeys = payload["device_keys"];
    if (!Array.isArray(deviceKeys) || deviceKeys.length === 0) {
      throw new BarkClientError("deviceKeys is required for batch push.", {
        code: "E_MISSING_DEVICE_KEYS",
      });
    }

    return this.#request<BarkApiResponse>("/push", payload, "POST");
  }

  async encryptedPush(
    options: BarkEncryptedPushOptions,
  ): Promise<BarkApiResponse> {
    const ciphertext = await encryptPayload(
      options.payload,
      options.encryption,
    );
    return this.push({
      deviceKey: options.deviceKey,
      ciphertext,
    });
  }

  async updateNotification(
    id: string,
    options: BarkPushOptions,
  ): Promise<BarkApiResponse> {
    return this.push({ ...options, id });
  }

  async deleteNotification(
    id: string,
    deviceKey?: string,
  ): Promise<BarkApiResponse> {
    return this.push({
      deviceKey: deviceKey ?? this.deviceKey,
      id,
      delete: true,
    });
  }

  async ping(): Promise<boolean> {
    const response = await this.#request<string>("/ping", undefined, "GET");
    return response.toLowerCase().includes("pong");
  }

  #buildPayload(
    options: BarkPushOptions | BarkBatchPushOptions,
  ): Record<string, unknown> {
    const payload: Record<string, unknown> = {};

    const setValue = (key: string, value: unknown) => {
      if (value !== undefined) {
        payload[key] = value;
      }
    };

    const deviceKey = "deviceKey" in options ? options.deviceKey : undefined;
    setValue("device_key", deviceKey ?? this.deviceKey);
    if ("deviceKeys" in options) {
      setValue("device_keys", options.deviceKeys);
    }

    setValue("title", options.title);
    setValue("subtitle", options.subtitle);
    setValue("body", options.body);
    setValue("markdown", options.markdown);
    setValue("level", options.level);
    setValue("volume", options.volume);
    setValue("badge", options.badge);
    setValue("sound", options.sound);
    setValue("icon", options.icon);
    setValue("image", options.image);
    setValue("group", options.group);
    setValue("url", options.url);
    setValue("copy", options.copy);
    setValue("autoCopy", toFlag(options.autoCopy));
    setValue("call", toFlag(options.call));
    setValue("isArchive", toFlag(options.isArchive));
    setValue("action", options.action);
    setValue("id", options.id);
    setValue("delete", toFlag(options.delete));
    setValue("ciphertext", options.ciphertext);

    return payload;
  }

  async #request<T>(
    path: string,
    payload?: Record<string, unknown>,
    method: "POST" | "GET" = "POST",
  ): Promise<T> {
    const url = new URL(path, this.baseUrl);

    const headers: Record<string, string> = {
      ...this.#headers,
    };

    let body: string | undefined;
    if (method === "POST") {
      headers["Content-Type"] = "application/json; charset=utf-8";
      body = JSON.stringify(payload ?? {});
    }

    const controller = this.timeoutMs ? new AbortController() : undefined;
    const timeoutId =
      this.timeoutMs && controller
        ? setTimeout(() => controller.abort(), this.timeoutMs)
        : undefined;

    try {
      const response = await this.#fetch(url.toString(), {
        method,
        headers,
        body,
        signal: controller?.signal,
      });

      const text = await response.text();
      const data = text.length > 0 ? this.#safeJson(text) : undefined;
      const responseBody = data ?? text;

      if (!response.ok) {
        throw new BarkClientError("Bark request failed.", {
          code: "E_API_ERROR",
          status: response.status,
          response: responseBody,
        });
      }

      if (data && typeof data === "object" && "code" in data) {
        const apiCode = (data as { code?: number }).code;
        if (typeof apiCode === "number" && apiCode !== 200) {
          throw new BarkClientError("Bark API returned an error response.", {
            code: "E_API_ERROR",
            status: response.status,
            response: responseBody,
          });
        }
      }

      return responseBody as T;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  #safeJson(input: string): unknown {
    try {
      return JSON.parse(input);
    } catch {
      return undefined;
    }
  }
}
