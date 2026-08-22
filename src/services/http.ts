export type QueryParams = Record<string, string | number | undefined>;

export interface RequestOptions {
  baseUrl: string;
  path: string;
  method?: "GET" | "POST";
  query?: QueryParams;
  body?: unknown;
  token?: string | null;
  fetchImpl?: typeof fetch;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Khoá query bị cấm. Mã hẹn và token là thông tin xác thực dạng bearer; lịch sử
 * trình duyệt, header Referer và log nginx đều lưu lại URL. Spec §6.2.
 */
const FORBIDDEN_QUERY_KEYS = [
  "code",
  "token",
  "redeem_token",
  "appointment_code",
  "session",
];

export function buildUrl(
  baseUrl: string,
  path: string,
  query?: QueryParams
): string {
  const url = `${baseUrl}${path}`;
  if (!query) {
    return url;
  }

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) {
      continue;
    }
    if (FORBIDDEN_QUERY_KEYS.includes(key)) {
      throw new Error(
        `Tham số "${key}" không được nằm trong URL — gửi trong thân JSON.`
      );
    }
    search.set(key, String(value));
  }

  const queryString = search.toString();
  return queryString ? `${url}?${queryString}` : url;
}

export async function request<T>(options: RequestOptions): Promise<T> {
  const {
    baseUrl,
    path,
    method = "GET",
    query,
    body,
    token,
    fetchImpl = fetch,
  } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetchImpl(buildUrl(baseUrl, path, query), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    throw new ApiError(
      response.status,
      "Không kết nối được máy chủ. Vui lòng thử lại."
    );
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      typeof payload?.message === "string"
        ? payload.message
        : "Đã có lỗi xảy ra. Vui lòng thử lại.",
      typeof payload?.code === "string" ? payload.code : undefined
    );
  }

  return payload as T;
}
