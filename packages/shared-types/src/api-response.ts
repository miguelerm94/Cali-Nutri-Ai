/**
 * Envelope canónico de respuesta del API.
 * Fuente: API.md §1 "Convenciones Globales" + BackendArchitecture.md §9 TransformInterceptor.
 */
export interface ApiMeta {
  timestamp: string;
  request_id: string;
  version: string;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta: ApiMeta;
  pagination?: {
    has_next: boolean;
    has_prev: boolean;
    next_cursor: string | null;
    prev_cursor: string | null;
    total_count: number;
    limit: number;
  };
}

export interface ApiErrorDetail {
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
    retry_after_seconds?: number;
  };
  meta: ApiMeta;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
