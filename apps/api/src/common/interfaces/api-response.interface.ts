export interface ApiMeta {
  timestamp: string;
  request_id: string;
  version: string;
}

export interface PaginatedMeta {
  has_next: boolean;
  has_prev: boolean;
  next_cursor: string | null;
  prev_cursor: string | null;
  total_count: number;
  limit: number;
}
