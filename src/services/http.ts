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

/**
 * Header mang phiên người bệnh.
 *
 * `emr-api` không đọc `Authorization`: `laySid()` trong `auth.ts` lấy mã phiên
 * từ cookie `emr_sid` hoặc header `X-Emr-Session`. Cookie bên thứ ba không
 * đáng tin trong webview Zalo, nên mini app đi bằng header.
 *
 * Nhưng KHÔNG dùng lại chính `X-Emr-Session`: đó là phiên **nhân viên**, tra
 * vào bảng `emr_session`. `modules/patient-app/README.md` yêu cầu phiên người
 * bệnh và phiên nhân viên không dùng chung bảng lẫn chốt quyền — cho hai loại
 * thông tin xác thực khác hẳn nhau đi chung một tên header là mời gọi nhầm lẫn.
 */
export const PATIENT_SESSION_HEADER = "X-Patient-Session";

/**
 * Nhận diện tunnel ngrok bản miễn phí.
 *
 * ngrok free chèn một trang HTML cảnh báo trước mọi request có User-Agent
 * giống trình duyệt — webview Zalo đúng là loại đó — nên API trả `text/html`
 * và `response.json()` ném lỗi. Header `ngrok-skip-browser-warning` tắt trang
 * ấy.
 *
 * Chỉ gắn cho tên miền ngrok, không gắn vô điều kiện: như vậy nó tự biến mất
 * khi `VITE_API_BASE_URL` trỏ về tên miền thật, và không có mẩu công cụ phát
 * triển nào lọt vào bản phát hành.
 */
const IS_NGROK_TUNNEL = /^https:\/\/[^/]+\.ngrok-free\.app(\/|$)/;

/**
 * Lỗi mang hình dạng đúng của emr-api.
 *
 * Bộ xử lý lỗi tập trung ở `src/index.ts` của emr-api trả `{ error, detail }`
 * cho mọi trường hợp — 404 không có tuyến, `HttpError` có chủ đích, trùng khoá
 * ER_DUP_ENTRY, và 500 bao trùm. Không tuyến nào trả `message`, cũng không
 * tuyến nào trả `code`; hai tên đó do phía client tự đặt ra và vì thế `message`
 * luôn rơi về câu mặc định.
 *
 * `detail` chỉ để chẩn đoán — nó có thể chứa `sqlMessage` — nên đừng bao giờ
 * đưa thẳng ra giao diện; chỗ hiển thị cho người bệnh là `message`.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly detail?: string
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
    headers[PATIENT_SESSION_HEADER] = token;
  }
  if (IS_NGROK_TUNNEL.test(baseUrl)) {
    headers["ngrok-skip-browser-warning"] = "1";
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
      typeof payload?.error === "string"
        ? payload.error
        : "Đã có lỗi xảy ra. Vui lòng thử lại.",
      typeof payload?.detail === "string" ? payload.detail : undefined
    );
  }

  return payload as T;
}
