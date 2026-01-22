export type BarkErrorCode =
  | "E_MISSING_DEVICE_KEY"
  | "E_MISSING_DEVICE_KEYS"
  | "E_FETCH_UNAVAILABLE"
  | "E_ENCRYPTION_UNAVAILABLE"
  | "E_ENCRYPTION_INVALID_KEY"
  | "E_ENCRYPTION_INVALID_IV"
  | "E_API_ERROR";

export class BarkClientError extends Error {
  readonly code: BarkErrorCode;
  readonly status?: number;
  readonly response?: unknown;

  constructor(
    message: string,
    options: { code: BarkErrorCode; status?: number; response?: unknown },
  ) {
    super(message);
    this.name = "BarkClientError";
    this.code = options.code;
    this.status = options.status;
    this.response = options.response;
  }
}
