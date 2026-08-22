# Khối B — Mini app người bệnh, giai đoạn 1 (front-end)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Biến template ZaUI Doctor thành mini app người bệnh của phòng khám, chạy được đầy đủ trên một tầng dữ liệu giả khớp chính xác hợp đồng API — để khi back-end `emr-api` xong thì chỉ đổi một biến môi trường.

**Architecture:** `src/services/` là tầng mới duy nhất chạm mạng: `http.ts` (fetch + Bearer + chặn bí mật lọt vào URL), `patient-app-api.ts` (13+2 endpoint của hợp đồng §6), `fake/` (cài đặt cùng `interface PatientAppApi`, mô phỏng cả quota 30% và luật chống đặt rác). `src/state.ts` giữ nguyên vai trò ranh giới duy nhất giữa UI và dữ liệu, nay gọi vào `services` thay vì `utils/mock.ts`. Các trang chỉ đọc atom.

**Tech Stack:** React 18 · TypeScript · Vite 5 · `zmp-ui` · `zmp-sdk` · Jotai · Tailwind + SCSS · Vitest (thêm mới)

**Spec:** [`docs/superpowers/specs/2026-08-22-zalo-mini-app-gd1-design.md`](../specs/2026-08-22-zalo-mini-app-gd1-design.md)

## Global Constraints

- **Toàn bộ chữ hiển thị cho người dùng là tiếng Việt.** Thông báo lỗi, nhãn nút, tiêu đề — tất cả.
- **Không màn hình nào, không kiểu dữ liệu nào chứa nội dung lâm sàng.** Không chẩn đoán, không kết quả xét nghiệm, không tên thuốc. Chỉ trạng thái. (spec §6.1 quy tắc 1)
- **Không đặt mã hẹn, token, hay bất kỳ bí mật nào trong URL hoặc query string.** (spec §6.2)
- **Phiên đi bằng header `Authorization: Bearer`, không dùng cookie.** (spec D8)
- **Mọi lời gọi đọc dữ liệu mang `patient_id`**, và UI không bao giờ tự suy ra hồ sơ — luôn lấy từ `activePatientIdState`. (spec §6)
- Điều hướng dùng `TransitionLink` hoặc `navigate(to, { viewTransition: true })`.
- Import nội bộ dùng alias `@/...`.
- `text-base` trong dự án này là **15px**, không phải 16px (`tailwind.config.js` ghi đè toàn bộ thang `fontSize`).
- Tiền VND định dạng qua `formatPrice` trong `src/utils/format.ts`.
- Cổng kiểm tra kiểu: `npx tsc --noEmit -p tsconfig.json` — phải sạch trước mỗi commit.
- `www/` là kết quả build, **không bao giờ sửa tay**.

## Đầu vào cần bạn cung cấp (chưa có trong kế hoạch)

Kế hoạch cố ý **không** bịa ba giá trị sau. Task 7 sẽ dừng lại hỏi:

| Giá trị | Dùng ở đâu | Ghi chú |
|---|---|---|
| `oaID` thật của phòng khám | `app-config.json` | Đang là `4318657068771012646` — OA mẫu của Zalo |
| Tên hiển thị chính thức | `app-config.json` → `app.title` | Kế hoạch tạm dùng `"Phòng khám phường Sài Gòn"` |
| Màu chủ đạo | `src/css/app.scss` → `--primary` | Đang là `#00abbb` của template; giữ nguyên nếu bạn chưa có bộ nhận diện |

## Quyết định kỹ thuật cần bạn biết

**Thêm Vitest làm devDependency.** Dự án hiện không có bộ kiểm thử nào. Tầng
`services/` chứa đúng loại lô-gic mà lỗi hay nấp: luật quota 30%, thang bậc xác
minh khi liên kết, việc gắn/không gắn Bearer, và quy tắc cấm bí mật lọt vào URL —
ba trong số đó là **tiêu chí nghiệm thu** ở spec §10. Những thứ đó phải có test tự
động. Vitest là bộ chạy test tự nhiên của một dự án Vite và không đụng vào bundle
sản phẩm.

**Các trang giao diện không có unit test.** Không thêm `@testing-library/react` cho
GĐ1. Cổng kiểm tra của trang là `tsc --noEmit` cộng chạy thật trong Zalo Mini App
Extension. Đây là đánh đổi có chủ ý: giá trị test trên trang hiển thị dữ liệu thấp
hơn nhiều so với trên tầng lô-gic, và mỗi devDependency thêm vào đều là chi phí lâu dài.

---

### Task 1: Bộ khung kiểm thử và cấu hình môi trường

**Files:**
- Create: `vitest.config.mts`
- Create: `.env.example`
- Create: `src/services/config.ts`
- Create: `src/services/__tests__/config.test.ts`
- Modify: `package.json` (scripts + devDependencies)
- Modify: `vite.config.mts` (thêm `envDir`)

**Interfaces:**
- Consumes: —
- Produces: `readRuntimeConfig(env: Record<string, unknown>): RuntimeConfig` với `RuntimeConfig = { apiBaseUrl: string; useFake: boolean }`

`vite.config.mts` đặt `root: "./src"`, nên mặc định Vite tìm tệp `.env` trong `src/`.
Nhưng `.env` của dự án nằm ở gốc (ZMP CLI đọc `APP_ID`/`ZMP_TOKEN` từ đó). Task này
đặt `envDir: ".."` để cả hai dùng chung một tệp.

- [ ] **Step 1: Cài Vitest**

```bash
npm install -D vitest@^2
```

- [ ] **Step 2: Tạo `vitest.config.mts`**

Cấu hình riêng, không đụng `vite.config.mts` để không ảnh hưởng bản build.

```typescript
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // `src/services/index.ts` đọc import.meta.env lúc nạp module và ném lỗi nếu
    // thiếu cấu hình. Test luôn chạy trên tầng dữ liệu giả.
    env: {
      VITE_USE_FAKE: "true",
    },
  },
});
```

- [ ] **Step 3: Thêm script vào `package.json`**

Trong `"scripts"`, thêm hai dòng:

```json
"test": "vitest run",
"typecheck": "tsc --noEmit -p tsconfig.json"
```

- [ ] **Step 4: Viết test thất bại cho `readRuntimeConfig`**

Tạo `src/services/__tests__/config.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { readRuntimeConfig } from "@/services/config";

describe("readRuntimeConfig", () => {
  it("đọc được base URL và cắt dấu gạch chéo thừa ở cuối", () => {
    const config = readRuntimeConfig({
      VITE_API_BASE_URL: "https://api.phongkham.vn/api/patient-app/",
      VITE_USE_FAKE: "false",
    });
    expect(config.apiBaseUrl).toBe("https://api.phongkham.vn/api/patient-app");
    expect(config.useFake).toBe(false);
  });

  it("bật chế độ giả khi VITE_USE_FAKE=true, không cần base URL", () => {
    const config = readRuntimeConfig({ VITE_USE_FAKE: "true" });
    expect(config.useFake).toBe(true);
    expect(config.apiBaseUrl).toBe("");
  });

  it("báo lỗi tiếng Việt khi gọi API thật mà thiếu base URL", () => {
    expect(() => readRuntimeConfig({ VITE_USE_FAKE: "false" })).toThrow(
      /Thiếu VITE_API_BASE_URL/
    );
  });
});
```

- [ ] **Step 5: Chạy test để chắc chắn nó thất bại**

Run: `npm test`
Expected: FAIL — không tìm thấy module `@/services/config`

- [ ] **Step 6: Viết cài đặt tối thiểu**

Tạo `src/services/config.ts`:

```typescript
export interface RuntimeConfig {
  /** Địa chỉ gốc của API người bệnh, đã cắt dấu `/` ở cuối. */
  apiBaseUrl: string;
  /** true = dùng tầng dữ liệu giả, không chạm mạng. */
  useFake: boolean;
}

export function readRuntimeConfig(
  env: Record<string, unknown>
): RuntimeConfig {
  const useFake = String(env.VITE_USE_FAKE ?? "").toLowerCase() === "true";
  const apiBaseUrl = String(env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");

  if (!useFake && !apiBaseUrl) {
    throw new Error(
      "Thiếu VITE_API_BASE_URL: đặt biến này trong .env, hoặc bật VITE_USE_FAKE=true để chạy với dữ liệu giả."
    );
  }

  return { apiBaseUrl, useFake };
}
```

- [ ] **Step 7: Chạy test để chắc chắn nó qua**

Run: `npm test`
Expected: PASS — 3 test

- [ ] **Step 8: Cho Vite đọc `.env` ở thư mục gốc**

Trong `vite.config.mts`, thêm `envDir` ngay dưới `base`:

```typescript
    root: "./src",
    base: "",
    envDir: "..",
```

- [ ] **Step 9: Tạo `.env.example`**

`.env` bị gitignore, nên bản mẫu này là tài liệu duy nhất về các biến cần có.

```bash
# Zalo Mini App CLI
APP_ID=
ZMP_TOKEN=

# API người bệnh của emr-api.
# Để trống và đặt VITE_USE_FAKE=true khi back-end chưa sẵn sàng.
VITE_API_BASE_URL=
VITE_USE_FAKE=true
```

- [ ] **Step 10: Đặt biến vào `.env` đang dùng**

Thêm hai dòng `VITE_USE_FAKE=true` và `VITE_API_BASE_URL=` vào cuối tệp `.env` ở
thư mục gốc. Không commit tệp này.

- [ ] **Step 11: Commit**

```bash
git add vitest.config.mts .env.example package.json package-lock.json vite.config.mts src/services
git commit -m "Thêm Vitest và tầng cấu hình môi trường cho API người bệnh"
```

---

### Task 2: Lưu phiên người bệnh

**Files:**
- Create: `src/services/session.ts`
- Create: `src/services/__tests__/session.test.ts`

**Interfaces:**
- Consumes: —
- Produces:
  - `interface StoredSession { token: string; activePatientId: number | null }`
  - `loadSession(): Promise<StoredSession | null>`
  - `saveSession(session: StoredSession): Promise<void>`
  - `clearSession(): Promise<void>`

Phiên đi bằng Bearer (spec D8), nên token phải nằm ở nơi mini app đọc được — kho
lưu trữ của `zmp-sdk`. `getStorage` trả về một object khoá-giá trị, giá trị là chuỗi.

- [ ] **Step 1: Viết test thất bại**

Tạo `src/services/__tests__/session.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

const store: Record<string, string> = {};

vi.mock("zmp-sdk", () => ({
  getStorage: vi.fn(async ({ keys }: { keys: string[] }) =>
    Object.fromEntries(keys.map((k) => [k, store[k]]))
  ),
  setStorage: vi.fn(async ({ data }: { data: Record<string, string> }) => {
    Object.assign(store, data);
  }),
  removeStorage: vi.fn(async ({ keys }: { keys: string[] }) => {
    keys.forEach((k) => delete store[k]);
  }),
}));

import { loadSession, saveSession, clearSession } from "@/services/session";

describe("session", () => {
  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k]);
  });

  it("trả về null khi chưa có phiên nào", async () => {
    expect(await loadSession()).toBeNull();
  });

  it("lưu rồi đọc lại được nguyên vẹn", async () => {
    await saveSession({ token: "abc123", activePatientId: 42 });
    expect(await loadSession()).toEqual({ token: "abc123", activePatientId: 42 });
  });

  it("xoá phiên thì đọc lại ra null", async () => {
    await saveSession({ token: "abc123", activePatientId: 42 });
    await clearSession();
    expect(await loadSession()).toBeNull();
  });

  it("trả về null khi dữ liệu lưu bị hỏng, không ném lỗi", async () => {
    store["patient_app_session"] = "{ không phải JSON";
    expect(await loadSession()).toBeNull();
  });
});
```

- [ ] **Step 2: Chạy test để chắc chắn nó thất bại**

Run: `npm test`
Expected: FAIL — không tìm thấy module `@/services/session`

- [ ] **Step 3: Viết cài đặt tối thiểu**

Tạo `src/services/session.ts`:

```typescript
import { getStorage, setStorage, removeStorage } from "zmp-sdk";

const STORAGE_KEY = "patient_app_session";

export interface StoredSession {
  /** Token Bearer của phiên app. Không bao giờ đưa vào URL. */
  token: string;
  /** Hồ sơ người bệnh đang xem; null khi chưa chọn. */
  activePatientId: number | null;
}

export async function loadSession(): Promise<StoredSession | null> {
  try {
    const data = await getStorage({ keys: [STORAGE_KEY] });
    const raw = data?.[STORAGE_KEY];
    if (typeof raw !== "string" || raw.length === 0) {
      return null;
    }
    const parsed = JSON.parse(raw) as StoredSession;
    if (typeof parsed?.token !== "string") {
      return null;
    }
    return {
      token: parsed.token,
      activePatientId:
        typeof parsed.activePatientId === "number"
          ? parsed.activePatientId
          : null,
    };
  } catch {
    return null;
  }
}

export async function saveSession(session: StoredSession): Promise<void> {
  await setStorage({ data: { [STORAGE_KEY]: JSON.stringify(session) } });
}

export async function clearSession(): Promise<void> {
  await removeStorage({ keys: [STORAGE_KEY] });
}
```

- [ ] **Step 4: Chạy test để chắc chắn nó qua**

Run: `npm test`
Expected: PASS — 4 test mới

- [ ] **Step 5: Commit**

```bash
git add src/services/session.ts src/services/__tests__/session.test.ts
git commit -m "Lưu phiên người bệnh bằng kho lưu trữ zmp-sdk"
```

---

### Task 3: Tầng HTTP và chốt chặn bí mật lọt vào URL

**Files:**
- Create: `src/services/http.ts`
- Create: `src/services/__tests__/http.test.ts`

**Interfaces:**
- Consumes: —
- Produces:
  - `class ApiError extends Error { status: number; code?: string }`
  - `buildUrl(baseUrl: string, path: string, query?: QueryParams): string`
  - `request<T>(options: RequestOptions): Promise<T>`
  - `type QueryParams = Record<string, string | number | undefined>`
  - `interface RequestOptions { baseUrl: string; path: string; method?: "GET" | "POST"; query?: QueryParams; body?: unknown; token?: string | null; fetchImpl?: typeof fetch }`

Đây là nơi hiện thực hoá tiêu chí nghiệm thu *"Không endpoint nào của app nhận mã
hẹn qua URL"* thành một chốt chặn chạy được, thay vì một lời hứa trong tài liệu.

- [ ] **Step 1: Viết test thất bại**

Tạo `src/services/__tests__/http.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { buildUrl, request, ApiError } from "@/services/http";

const BASE = "https://api.phongkham.vn/api/patient-app";

function fakeFetch(status: number, payload: unknown) {
  return vi.fn(async () =>
    new Response(JSON.stringify(payload), {
      status,
      headers: { "Content-Type": "application/json" },
    })
  ) as unknown as typeof fetch;
}

describe("buildUrl", () => {
  it("ghép đường dẫn và bỏ qua tham số undefined", () => {
    const url = buildUrl(BASE, "/slots", { department: 3, date: undefined });
    expect(url).toBe(`${BASE}/slots?department=3`);
  });

  it("không thêm dấu ? khi không có tham số nào", () => {
    expect(buildUrl(BASE, "/me")).toBe(`${BASE}/me`);
  });

  it("từ chối đưa bí mật vào query — đây là tiêu chí nghiệm thu của spec §6.2", () => {
    expect(() => buildUrl(BASE, "/redeem", { code: "HK260822123" })).toThrow(
      /không được nằm trong URL/
    );
    expect(() => buildUrl(BASE, "/queue", { token: "abc" })).toThrow(
      /không được nằm trong URL/
    );
  });
});

describe("request", () => {
  it("gắn header Bearer khi có token", async () => {
    const spy = fakeFetch(200, { ok: true });
    await request({ baseUrl: BASE, path: "/me", token: "abc", fetchImpl: spy });

    const [, init] = (spy as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(init.headers.Authorization).toBe("Bearer abc");
  });

  it("không gắn header Bearer khi không có token", async () => {
    const spy = fakeFetch(200, { ok: true });
    await request({ baseUrl: BASE, path: "/departments", fetchImpl: spy });

    const [, init] = (spy as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(init.headers.Authorization).toBeUndefined();
  });

  it("gửi thân JSON với phương thức POST", async () => {
    const spy = fakeFetch(200, { ok: true });
    await request({
      baseUrl: BASE,
      path: "/redeem",
      method: "POST",
      body: { code: "HK260822123" },
      fetchImpl: spy,
    });

    const [url, init] = (spy as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe(`${BASE}/redeem`);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ code: "HK260822123" });
  });

  it("ném ApiError kèm thông báo của máy chủ khi lỗi", async () => {
    const spy = fakeFetch(429, { message: "Bạn đã thử quá nhiều lần." });
    await expect(
      request({ baseUrl: BASE, path: "/redeem", method: "POST", fetchImpl: spy })
    ).rejects.toMatchObject({ status: 429, message: "Bạn đã thử quá nhiều lần." });
  });

  it("ném ApiError với thông báo tiếng Việt khi máy chủ không trả JSON", async () => {
    const spy = vi.fn(async () => new Response("<html>502</html>", { status: 502 })) as unknown as typeof fetch;
    await expect(
      request({ baseUrl: BASE, path: "/me", fetchImpl: spy })
    ).rejects.toThrow(/Không kết nối được máy chủ/);
  });
});

describe("ApiError", () => {
  it("giữ mã trạng thái", () => {
    expect(new ApiError(404, "Không tìm thấy").status).toBe(404);
  });
});
```

- [ ] **Step 2: Chạy test để chắc chắn nó thất bại**

Run: `npm test`
Expected: FAIL — không tìm thấy module `@/services/http`

- [ ] **Step 3: Viết cài đặt tối thiểu**

Tạo `src/services/http.ts`:

```typescript
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
```

- [ ] **Step 4: Chạy test để chắc chắn nó qua**

Run: `npm test`
Expected: PASS — 9 test mới

- [ ] **Step 5: Commit**

```bash
git add src/services/http.ts src/services/__tests__/http.test.ts
git commit -m "Tầng HTTP với Bearer và chốt chặn bí mật lọt vào URL"
```

---

### Task 4: Kiểu dữ liệu và client API thật

**Files:**
- Rewrite: `src/types.d.ts`
- Create: `src/services/patient-app-api.ts`
- Create: `src/services/__tests__/patient-app-api.test.ts`

**Interfaces:**
- Consumes: `request`, `ApiError` (Task 3)
- Produces: `interface PatientAppApi` với 15 phương thức dưới đây, và
  `createHttpApi(baseUrl: string, getToken: () => string | null, fetchImpl?: typeof fetch): PatientAppApi`

Kiểu dữ liệu của template (`Doctor`, `Service`, `Invoice`, `Article`…) bị thay hoàn
toàn. Chú ý điều gì **không** có trong các kiểu này: không chẩn đoán, không kết
quả, không tên thuốc.

- [ ] **Step 1: Viết lại `src/types.d.ts`**

```typescript
export type Session = "SANG" | "CHIEU";

export type AppointmentStatus =
  | "Scheduled"
  | "CheckedIn"
  | "Completed"
  | "Cancelled"
  | "Missed"
  | "WaitListed";

export type NotificationKind =
  | "RESULT_READY"
  | "APPOINTMENT_REMINDER"
  | "APPOINTMENT_CHANGED";

export interface PatientProfile {
  patientId: number;
  patientCode: string;
  fullName: string;
  gender: "M" | "F" | "U";
  /** YYYY-MM-DD */
  birthdate: string;
  /** Chỉ 4 số cuối, máy chủ đã che phần còn lại. */
  insuranceLast4?: string;
}

export interface Department {
  id: number;
  name: string;
  description?: string;
}

export interface SlotAvailability {
  /** YYYY-MM-DD */
  date: string;
  session: Session;
  /** Số chỗ còn lại cho kênh app, máy chủ đã trừ quota 30%. */
  remaining: number;
}

export interface Appointment {
  id: number;
  /** Mã hiển thị, ví dụ HK260822088. Chỉ để đọc cho nhân viên nghe. */
  appointmentCode: string;
  patientId: number;
  department: Department;
  /** YYYY-MM-DD */
  apptDate: string;
  session: Session;
  status: AppointmentStatus;
  patientConfirmed: boolean;
  /** Yêu cầu chuẩn bị, ví dụ "nhịn ăn 8 tiếng". Không phải nội dung lâm sàng. */
  prepNote?: string;
}

export interface QueueStatus {
  patientId: number;
  /** Số thứ tự của tôi hôm nay; null khi chưa vào hàng đợi. */
  myNumber: number | null;
  /** Số đang được gọi tại phòng. */
  currentNumber: number | null;
  roomName: string | null;
  estimatedWaitMinutes: number | null;
}

export interface InvoiceSummary {
  id: number;
  /** YYYY-MM-DD */
  visitDate: string;
  /** Phần người bệnh phải trả, đơn vị VND. */
  amountDue: number;
  paid: boolean;
}

export interface VietQrPayload {
  invoiceId: number;
  /** Chuỗi nội dung để dựng mã QR. */
  qrContent: string;
  amount: number;
  /** ISO 8601 */
  expiresAt: string;
}

export interface AppNotification {
  id: number;
  patientId: number;
  kind: NotificationKind;
  /** ISO 8601 */
  createdAt: string;
  title: string;
  /** Chỉ trạng thái. Không bao giờ chứa nội dung kết quả hay tên thuốc. */
  body: string;
  appointmentId?: number;
}

/** Máy chủ cần thêm yếu tố xác minh trước khi cho liên kết. Spec §5.4. */
export interface LinkChallenge {
  outcome: "CHALLENGE";
  need: "BIRTHDATE" | "INSURANCE_LAST4";
}

export interface LinkSuccess {
  outcome: "LINKED";
  token: string;
  profiles: PatientProfile[];
}

export type LinkResponse = LinkChallenge | LinkSuccess;

export interface LinkInput {
  /** Token do getPhoneNumber() của zmp-sdk trả về. Máy chủ đổi ra số thật. */
  zaloPhoneToken: string;
  /** YYYY-MM-DD — yếu tố thứ hai. */
  birthdate?: string;
  /** 4 số cuối thẻ BHYT — chỉ khi máy chủ yêu cầu. */
  insuranceLast4?: string;
}

export interface CreateAppointmentInput {
  patientId: number;
  departmentId: number;
  /** YYYY-MM-DD */
  date: string;
  session: Session;
  reason?: string;
}
```

- [ ] **Step 2: Dọn `src/utils/format.ts`**

Tệp này import `TimeSlot` — kiểu vừa bị xoá khỏi `types.d.ts`. Bỏ dòng import đầu
tệp và bỏ hàm `formatTimeSlot` ở cuối tệp (mini app GĐ1 hẹn theo **buổi**, không
theo giờ, nên không còn dùng đến nó). Giữ nguyên `formatPrice`, `formatDayName`,
`formatFullDate`, `formatShortDate`.

- [ ] **Step 3: Viết test thất bại cho client**

Tạo `src/services/__tests__/patient-app-api.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { createHttpApi } from "@/services/patient-app-api";

const BASE = "https://api.phongkham.vn/api/patient-app";

function spyFetch(payload: unknown = { ok: true }) {
  return vi.fn(async () =>
    new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  ) as unknown as typeof fetch;
}

function callOf(spy: typeof fetch, index = 0) {
  return (spy as unknown as ReturnType<typeof vi.fn>).mock.calls[index];
}

describe("createHttpApi", () => {
  it("gửi mã hẹn trong thân JSON, không phải trong URL", async () => {
    const spy = spyFetch({ token: "t", appointmentId: 9 });
    const api = createHttpApi(BASE, () => null, spy);

    await api.redeem({ code: "HK260822088" });

    const [url, init] = callOf(spy);
    expect(url).toBe(`${BASE}/redeem`);
    expect(String(url)).not.toContain("HK260822088");
    expect(JSON.parse(init.body)).toEqual({ code: "HK260822088" });
  });

  it("truyền patient_id vào query khi đọc lịch hẹn", async () => {
    const spy = spyFetch([]);
    const api = createHttpApi(BASE, () => "abc", spy);

    await api.appointments({ patientId: 42 });

    expect(String(callOf(spy)[0])).toBe(`${BASE}/appointments?patient_id=42`);
  });

  it("gọi departments mà không cần token", async () => {
    const spy = spyFetch([]);
    const api = createHttpApi(BASE, () => null, spy);

    await api.departments();

    expect(callOf(spy)[1].headers.Authorization).toBeUndefined();
  });

  it("lấy token mới ở mỗi lời gọi, không giữ bản sao cũ", async () => {
    const spy = spyFetch({ profiles: [] });
    let token: string | null = null;
    const api = createHttpApi(BASE, () => token, spy);

    await api.me();
    token = "sau-khi-lien-ket";
    await api.me();

    expect(callOf(spy, 0)[1].headers.Authorization).toBeUndefined();
    expect(callOf(spy, 1)[1].headers.Authorization).toBe("Bearer sau-khi-lien-ket");
  });

  it("huỷ lịch hẹn gửi lý do trong thân JSON", async () => {
    const spy = spyFetch({ id: 9 });
    const api = createHttpApi(BASE, () => "abc", spy);

    await api.cancelAppointment(9, "Bận việc đột xuất");

    const [url, init] = callOf(spy);
    expect(url).toBe(`${BASE}/appointments/9/cancel`);
    expect(JSON.parse(init.body)).toEqual({ reason: "Bận việc đột xuất" });
  });
});
```

- [ ] **Step 4: Chạy test để chắc chắn nó thất bại**

Run: `npm test`
Expected: FAIL — không tìm thấy module `@/services/patient-app-api`

- [ ] **Step 5: Viết cài đặt tối thiểu**

Tạo `src/services/patient-app-api.ts`:

```typescript
import { request } from "./http";
import type {
  Appointment,
  AppNotification,
  CreateAppointmentInput,
  Department,
  InvoiceSummary,
  LinkInput,
  LinkResponse,
  PatientProfile,
  QueueStatus,
  SlotAvailability,
  VietQrPayload,
} from "@/types";

/**
 * Hợp đồng API người bệnh — spec §6. Tầng giả và tầng thật cùng cài đặt
 * interface này, nên đổi giữa hai bên chỉ là đổi một biến môi trường.
 */
export interface PatientAppApi {
  link(input: LinkInput): Promise<LinkResponse>;
  me(): Promise<{ profiles: PatientProfile[] }>;
  departments(): Promise<Department[]>;
  slots(params: { departmentId: number; date: string }): Promise<SlotAvailability[]>;
  createAppointment(input: CreateAppointmentInput): Promise<Appointment>;
  appointments(params: { patientId: number }): Promise<Appointment[]>;
  appointment(id: number): Promise<Appointment>;
  redeem(input: { code: string }): Promise<{ token: string; appointmentId: number }>;
  confirmAppointment(id: number): Promise<Appointment>;
  cancelAppointment(id: number, reason: string): Promise<Appointment>;
  queue(params: { patientId: number }): Promise<QueueStatus>;
  invoices(params: { patientId: number }): Promise<InvoiceSummary[]>;
  invoiceQr(id: number): Promise<VietQrPayload>;
  notifications(params: { patientId: number }): Promise<AppNotification[]>;
  unlink(patientId: number): Promise<void>;
}

export function createHttpApi(
  baseUrl: string,
  getToken: () => string | null,
  fetchImpl?: typeof fetch
): PatientAppApi {
  const call = <T>(
    path: string,
    init: {
      method?: "GET" | "POST";
      query?: Record<string, string | number | undefined>;
      body?: unknown;
      anonymous?: boolean;
    } = {}
  ) =>
    request<T>({
      baseUrl,
      path,
      method: init.method,
      query: init.query,
      body: init.body,
      token: init.anonymous ? null : getToken(),
      fetchImpl,
    });

  return {
    link: (input) => call("/link", { method: "POST", body: input, anonymous: true }),

    me: () => call("/me"),

    departments: () => call("/departments", { anonymous: true }),

    slots: ({ departmentId, date }) =>
      call("/slots", { query: { department: departmentId, date } }),

    createAppointment: (input) =>
      call("/appointments", { method: "POST", body: input }),

    appointments: ({ patientId }) =>
      call("/appointments", { query: { patient_id: patientId } }),

    appointment: (id) => call(`/appointments/${id}`),

    redeem: (input) =>
      call("/redeem", { method: "POST", body: input, anonymous: true }),

    confirmAppointment: (id) =>
      call(`/appointments/${id}/confirm`, { method: "POST" }),

    cancelAppointment: (id, reason) =>
      call(`/appointments/${id}/cancel`, { method: "POST", body: { reason } }),

    queue: ({ patientId }) => call("/queue", { query: { patient_id: patientId } }),

    invoices: ({ patientId }) =>
      call("/invoices", { query: { patient_id: patientId } }),

    invoiceQr: (id) => call(`/invoices/${id}/qr`),

    notifications: ({ patientId }) =>
      call("/notifications", { query: { patient_id: patientId } }),

    unlink: (patientId) =>
      call("/unlink", { method: "POST", body: { patientId } }),
  };
}
```

- [ ] **Step 6: Chạy test để chắc chắn nó qua**

Run: `npm test`
Expected: PASS — 5 test mới

- [ ] **Step 7: Ghi endpoint `unlink` vào spec**

`unlink` không có trong danh sách §6 nhưng tiêu chí nghiệm thu §10 đòi *"Huỷ liên
kết được, có hiệu lực ngay, và liên kết lại được sau đó"*. Thêm một dòng vào bảng
bổ sung ở §6 của spec:

```markdown
| POST | `/api/patient-app/unlink` | Phiên app — thân JSON mang `patientId` |
```

- [ ] **Step 8: Commit**

```bash
git add src/types.d.ts src/utils/format.ts src/services/patient-app-api.ts src/services/__tests__/patient-app-api.test.ts docs/superpowers/specs
git commit -m "Kiểu dữ liệu và client API người bệnh theo hợp đồng spec section 6"
```

---

### Task 5: Tầng dữ liệu giả và điểm chọn cài đặt

**Files:**
- Create: `src/services/fake/data.ts`
- Create: `src/services/fake/index.ts`
- Create: `src/services/index.ts`
- Create: `src/services/__tests__/fake.test.ts`
- Delete: `src/utils/mock.ts`

**Interfaces:**
- Consumes: `PatientAppApi` (Task 4), `readRuntimeConfig` (Task 1), `loadSession` (Task 2)
- Produces: `createFakeApi(): PatientAppApi`, và `api: PatientAppApi` xuất từ `src/services/index.ts`

Tầng giả phải mô phỏng **cả luật nghiệp vụ**, không chỉ trả dữ liệu tĩnh — nếu
không, giao diện sẽ được xây trên những giả định mà back-end thật sẽ bác bỏ. Hai
luật bắt buộc: quota 30% (spec §5.3) và tối đa 2 lịch hẹn đang mở mỗi hồ sơ (§8).

- [ ] **Step 1: Viết test thất bại**

Tạo `src/services/__tests__/fake.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { createFakeApi } from "@/services/fake";

const NGAY = "2026-09-01";

async function apiDaLienKet() {
  const api = createFakeApi();
  const ketQua = await api.link({
    zaloPhoneToken: "token-gia",
    birthdate: "1990-05-12",
  });
  if (ketQua.outcome !== "LINKED") {
    throw new Error("Mong đợi liên kết thành công");
  }
  return { api, profiles: ketQua.profiles };
}

describe("createFakeApi — liên kết", () => {
  it("hỏi ngày sinh trước khi cho liên kết", async () => {
    const api = createFakeApi();
    const ketQua = await api.link({ zaloPhoneToken: "token-gia" });
    expect(ketQua).toEqual({ outcome: "CHALLENGE", need: "BIRTHDATE" });
  });

  it("từ chối khi ngày sinh sai, không tiết lộ hồ sơ nào tồn tại", async () => {
    const api = createFakeApi();
    await expect(
      api.link({ zaloPhoneToken: "token-gia", birthdate: "1970-01-01" })
    ).rejects.toThrow(/Thông tin không khớp/);
  });

  it("trả về nhiều hồ sơ cho một tài khoản", async () => {
    const { profiles } = await apiDaLienKet();
    expect(profiles.length).toBeGreaterThanOrEqual(2);
  });
});

describe("createFakeApi — đặt lịch", () => {
  it("chỉ mở 30% công suất cho kênh app", async () => {
    const { api } = await apiDaLienKet();
    const slots = await api.slots({ departmentId: 1, date: NGAY });
    const sang = slots.find((s) => s.session === "SANG");
    // Buổi sáng khoa 1 có 20 chỗ trong dữ liệu giả -> 30% = 6
    expect(sang?.remaining).toBe(6);
  });

  it("giảm số chỗ còn lại sau khi đặt", async () => {
    const { api, profiles } = await apiDaLienKet();
    await api.createAppointment({
      patientId: profiles[0].patientId,
      departmentId: 1,
      date: NGAY,
      session: "SANG",
    });

    const slots = await api.slots({ departmentId: 1, date: NGAY });
    expect(slots.find((s) => s.session === "SANG")?.remaining).toBe(5);
  });

  it("chặn hồ sơ có quá 2 lịch hẹn đang mở", async () => {
    const { api, profiles } = await apiDaLienKet();
    const patientId = profiles[0].patientId;
    const dat = (date: string) =>
      api.createAppointment({ patientId, departmentId: 1, date, session: "SANG" });

    await dat("2026-09-01");
    await dat("2026-09-02");

    await expect(dat("2026-09-03")).rejects.toThrow(/tối đa 2 lịch hẹn/);
  });

  it("huỷ lịch hẹn giải phóng lại chỗ đã giữ", async () => {
    const { api, profiles } = await apiDaLienKet();
    const patientId = profiles[0].patientId;
    const hen = await api.createAppointment({
      patientId,
      departmentId: 1,
      date: NGAY,
      session: "SANG",
    });

    await api.cancelAppointment(hen.id, "Đổi ý");

    const slots = await api.slots({ departmentId: 1, date: NGAY });
    expect(slots.find((s) => s.session === "SANG")?.remaining).toBe(6);
  });

  it("lịch hẹn mới ở trạng thái Scheduled và chưa được xác nhận", async () => {
    const { api, profiles } = await apiDaLienKet();
    const hen = await api.createAppointment({
      patientId: profiles[0].patientId,
      departmentId: 1,
      date: NGAY,
      session: "SANG",
    });

    expect(hen.status).toBe("Scheduled");
    expect(hen.patientConfirmed).toBe(false);
    expect(hen.appointmentCode).toMatch(/^HK\d+$/);
  });
});

describe("createFakeApi — không rò rỉ nội dung lâm sàng", () => {
  it("thông báo chỉ nói kết quả đã có, không nói kết quả là gì", async () => {
    const { api, profiles } = await apiDaLienKet();
    const list = await api.notifications({ patientId: profiles[0].patientId });
    const body = list.map((n) => `${n.title} ${n.body}`).join(" ").toLowerCase();

    for (const cam of ["chẩn đoán", "dương tính", "âm tính", "mg", "paracetamol"]) {
      expect(body).not.toContain(cam);
    }
  });
});
```

- [ ] **Step 2: Chạy test để chắc chắn nó thất bại**

Run: `npm test`
Expected: FAIL — không tìm thấy module `@/services/fake`

- [ ] **Step 3: Viết dữ liệu giả**

Tạo `src/services/fake/data.ts`:

```typescript
import type { Department, PatientProfile } from "@/types";

export const KHOA: Department[] = [
  { id: 1, name: "Khoa Nội", description: "Khám và điều trị bệnh nội khoa" },
  { id: 2, name: "Khoa Ngoại", description: "Khám ngoại khoa, tiểu phẫu" },
  { id: 3, name: "Khoa Sản", description: "Khám phụ khoa, thai sản" },
  { id: 4, name: "Khoa Nhi", description: "Khám và điều trị cho trẻ em" },
];

/** Tổng số chỗ mỗi buổi theo khoa, trước khi trừ quota kênh app. */
export const CONG_SUAT: Record<number, { SANG: number; CHIEU: number }> = {
  1: { SANG: 20, CHIEU: 20 },
  2: { SANG: 10, CHIEU: 10 },
  3: { SANG: 10, CHIEU: 0 },
  4: { SANG: 20, CHIEU: 10 },
};

/** Quota kênh app — spec D6. */
export const QUOTA_ONLINE_PCT = 30;

/** Số điện thoại giả này ứng với hai hồ sơ: mẹ và con. */
export const NGAY_SINH_HOP_LE = "1990-05-12";

export const HO_SO: PatientProfile[] = [
  {
    patientId: 101,
    patientCode: "BN0000101",
    fullName: "Nguyễn Thị Lan",
    gender: "F",
    birthdate: NGAY_SINH_HOP_LE,
    insuranceLast4: "4821",
  },
  {
    patientId: 102,
    patientCode: "BN0000102",
    fullName: "Nguyễn Minh Khôi",
    gender: "M",
    birthdate: "2018-11-03",
    insuranceLast4: "7734",
  },
];
```

- [ ] **Step 4: Viết cài đặt giả**

Tạo `src/services/fake/index.ts`:

```typescript
import type { PatientAppApi } from "../patient-app-api";
import type {
  Appointment,
  AppNotification,
  InvoiceSummary,
  Session,
  SlotAvailability,
} from "@/types";
import { CONG_SUAT, HO_SO, KHOA, NGAY_SINH_HOP_LE, QUOTA_ONLINE_PCT } from "./data";

const TRE = 300;
const doiMotChut = () => new Promise((r) => setTimeout(r, TRE));

const DANG_MO: Appointment["status"][] = ["Scheduled", "CheckedIn", "WaitListed"];

export function createFakeApi(): PatientAppApi {
  const lichHen: Appointment[] = [];
  let idTiepTheo = 1;
  let daLienKet = false;

  const khoaTheoId = (id: number) => {
    const khoa = KHOA.find((k) => k.id === id);
    if (!khoa) {
      throw new Error("Không tìm thấy chuyên khoa.");
    }
    return khoa;
  };

  const daGiu = (departmentId: number, date: string, session: Session) =>
    lichHen.filter(
      (h) =>
        h.department.id === departmentId &&
        h.apptDate === date &&
        h.session === session &&
        DANG_MO.includes(h.status)
    ).length;

  const choMoChoApp = (departmentId: number, session: Session) =>
    Math.floor((CONG_SUAT[departmentId]?.[session] ?? 0) * QUOTA_ONLINE_PCT / 100);

  const buocXacMinh = (patientId: number) => {
    if (!daLienKet) {
      throw new Error("Vui lòng liên kết tài khoản trước.");
    }
    if (!HO_SO.some((h) => h.patientId === patientId)) {
      throw new Error("Hồ sơ không thuộc tài khoản này.");
    }
  };

  return {
    async link(input) {
      await doiMotChut();
      if (!input.birthdate) {
        return { outcome: "CHALLENGE", need: "BIRTHDATE" };
      }
      if (input.birthdate !== NGAY_SINH_HOP_LE) {
        // Cùng một thông báo cho mọi kiểu sai — spec §5.4.
        throw new Error("Thông tin không khớp. Vui lòng kiểm tra lại.");
      }
      daLienKet = true;
      return { outcome: "LINKED", token: "phien-gia", profiles: [...HO_SO] };
    },

    async me() {
      await doiMotChut();
      return { profiles: daLienKet ? [...HO_SO] : [] };
    },

    async departments() {
      await doiMotChut();
      return [...KHOA];
    },

    async slots({ departmentId, date }) {
      await doiMotChut();
      const buoi: Session[] = ["SANG", "CHIEU"];
      return buoi.map<SlotAvailability>((session) => ({
        date,
        session,
        remaining: Math.max(
          0,
          choMoChoApp(departmentId, session) - daGiu(departmentId, date, session)
        ),
      }));
    },

    async createAppointment(input) {
      await doiMotChut();
      buocXacMinh(input.patientId);

      const dangMo = lichHen.filter(
        (h) => h.patientId === input.patientId && DANG_MO.includes(h.status)
      ).length;
      if (dangMo >= 2) {
        throw new Error(
          "Mỗi hồ sơ chỉ được giữ tối đa 2 lịch hẹn cùng lúc. Vui lòng huỷ bớt trước khi đặt thêm."
        );
      }

      const conLai =
        choMoChoApp(input.departmentId, input.session) -
        daGiu(input.departmentId, input.date, input.session);
      if (conLai <= 0) {
        throw new Error("Buổi này đã hết chỗ đặt trực tuyến. Vui lòng chọn buổi khác.");
      }

      const id = idTiepTheo++;
      const hen: Appointment = {
        id,
        appointmentCode: `HK${input.date.replace(/-/g, "").slice(2)}${id}`,
        patientId: input.patientId,
        department: khoaTheoId(input.departmentId),
        apptDate: input.date,
        session: input.session,
        status: "Scheduled",
        patientConfirmed: false,
      };
      lichHen.push(hen);
      return { ...hen };
    },

    async appointments({ patientId }) {
      await doiMotChut();
      buocXacMinh(patientId);
      return lichHen
        .filter((h) => h.patientId === patientId)
        .map((h) => ({ ...h }))
        .sort((a, b) => a.apptDate.localeCompare(b.apptDate));
    },

    async appointment(id) {
      await doiMotChut();
      const hen = lichHen.find((h) => h.id === id);
      if (!hen) {
        throw new Error("Không tìm thấy lịch hẹn.");
      }
      return { ...hen };
    },

    async redeem({ code }) {
      await doiMotChut();
      const hen = lichHen.find((h) => h.appointmentCode === code);
      if (!hen) {
        throw new Error("Mã hẹn không đúng.");
      }
      return { token: "phien-ngan-han-gia", appointmentId: hen.id };
    },

    async confirmAppointment(id) {
      await doiMotChut();
      const hen = lichHen.find((h) => h.id === id);
      if (!hen) {
        throw new Error("Không tìm thấy lịch hẹn.");
      }
      hen.patientConfirmed = true;
      return { ...hen };
    },

    async cancelAppointment(id) {
      await doiMotChut();
      const hen = lichHen.find((h) => h.id === id);
      if (!hen) {
        throw new Error("Không tìm thấy lịch hẹn.");
      }
      if (hen.status !== "Scheduled" && hen.status !== "WaitListed") {
        throw new Error("Lịch hẹn này không huỷ được nữa.");
      }
      hen.status = "Cancelled";
      return { ...hen };
    },

    async queue({ patientId }) {
      await doiMotChut();
      buocXacMinh(patientId);
      return {
        patientId,
        myNumber: 27,
        currentNumber: 21,
        roomName: "Phòng khám số 2",
        estimatedWaitMinutes: 18,
      };
    },

    async invoices({ patientId }) {
      await doiMotChut();
      buocXacMinh(patientId);
      const list: InvoiceSummary[] = [
        { id: 9001, visitDate: "2026-08-14", amountDue: 42000, paid: false },
        { id: 9002, visitDate: "2026-07-02", amountDue: 0, paid: true },
      ];
      return list;
    },

    async invoiceQr(id) {
      await doiMotChut();
      return {
        invoiceId: id,
        qrContent: `VIETQR|HOADON|${id}`,
        amount: 42000,
        expiresAt: "2026-12-31T23:59:59+07:00",
      };
    },

    async notifications({ patientId }) {
      await doiMotChut();
      buocXacMinh(patientId);
      const list: AppNotification[] = [
        {
          id: 1,
          patientId,
          kind: "RESULT_READY",
          createdAt: "2026-08-20T09:12:00+07:00",
          title: "Kết quả đã có",
          body: "Kết quả xét nghiệm ngày 20/08 đã sẵn sàng. Vui lòng xem trên Sổ sức khoẻ điện tử VNeID hoặc nhận tại quầy.",
        },
        {
          id: 2,
          patientId,
          kind: "APPOINTMENT_REMINDER",
          createdAt: "2026-08-19T08:00:00+07:00",
          title: "Nhắc lịch hẹn",
          body: "Bạn có lịch hẹn vào buổi sáng ngày 22/08 tại Khoa Nội.",
        },
      ];
      return list;
    },

    async unlink() {
      await doiMotChut();
      daLienKet = false;
    },
  };
}
```

- [ ] **Step 5: Chạy test để chắc chắn nó qua**

Run: `npm test`
Expected: PASS — 9 test mới

- [ ] **Step 6: Viết điểm chọn cài đặt**

Tạo `src/services/index.ts`:

```typescript
import { readRuntimeConfig } from "./config";
import { createFakeApi } from "./fake";
import { createHttpApi, type PatientAppApi } from "./patient-app-api";

export const runtimeConfig = readRuntimeConfig(
  import.meta.env as unknown as Record<string, unknown>
);

/** Token Bearer hiện hành, do state.ts cập nhật sau khi liên kết. */
let phienHienTai: string | null = null;

export function setSessionToken(token: string | null): void {
  phienHienTai = token;
}

export const api: PatientAppApi = runtimeConfig.useFake
  ? createFakeApi()
  : createHttpApi(runtimeConfig.apiBaseUrl, () => phienHienTai);

export type { PatientAppApi };
```

- [ ] **Step 7: Xoá dữ liệu mock của template**

```bash
git rm src/utils/mock.ts
```

`src/state.ts` sẽ hỏng ngay lúc này — Task 6 sửa. Không chạy typecheck ở bước này.

- [ ] **Step 8: Commit**

```bash
git add src/services
git commit -m "Tầng dữ liệu giả khớp hợp đồng, có quota 30% và luật chống đặt rác"
```

---

### Task 6: Viết lại `state.ts`

**Files:**
- Rewrite: `src/state.ts`
- Create: `src/services/__tests__/state.test.ts`

**Interfaces:**
- Consumes: `api`, `setSessionToken` (Task 5), `loadSession`, `saveSession`, `clearSession` (Task 2)
- Produces: `activePatientIdState`, `hydrateSessionState`, `applyLinkState`, `unlinkState`, `profilesState`, `activeProfileState`, `departmentsState`, `slotsState`, `appointmentsState`, `appointmentByIdState`, `queueState`, `invoicesState`, `notificationsState`, `bookingFormState`, `customTitleState`

Mọi atom đọc dữ liệu là `atomFamily` khoá theo `patientId` — chuyển hồ sơ người
thân không được lẫn dữ liệu giữa các hồ sơ.

- [ ] **Step 1: Viết test thất bại**

Tạo `src/services/__tests__/state.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { createStore } from "jotai";

vi.mock("zmp-sdk", () => ({
  getStorage: vi.fn(async () => ({})),
  setStorage: vi.fn(async () => undefined),
  removeStorage: vi.fn(async () => undefined),
  getUserInfo: vi.fn(async () => ({ userInfo: { name: "Người dùng thử" } })),
}));

import { departmentsState, appointmentsState } from "@/state";

describe("state", () => {
  it("departmentsState trả về danh sách khoa từ tầng dữ liệu", async () => {
    const store = createStore();
    const khoa = await store.get(departmentsState);
    expect(khoa.map((k) => k.name)).toContain("Khoa Nội");
  });

  it("appointmentsState tách riêng theo từng hồ sơ", async () => {
    const store = createStore();
    expect(appointmentsState(101)).not.toBe(appointmentsState(102));
  });
});
```

- [ ] **Step 2: Chạy test để chắc chắn nó thất bại**

Run: `npm test`
Expected: FAIL — `src/state.ts` vẫn import `./utils/mock` đã bị xoá

- [ ] **Step 3: Viết lại `src/state.ts`**

```typescript
import { atom } from "jotai";
import { atomFamily, atomWithRefresh, atomWithReset } from "jotai/utils";
import { api, setSessionToken } from "@/services";
import { clearSession, loadSession, saveSession } from "@/services/session";
import type { Session } from "@/types";

/**
 * Phiên và hồ sơ đang xem
 */
export const profilesState = atomWithRefresh(async () => {
  const { profiles } = await api.me();
  return profiles;
});

/** Kho chứa thật, không xuất ra ngoài — ghi vào đây không kèm việc lưu trữ. */
const activePatientIdBaseState = atom<number | null>(null);

/**
 * Hồ sơ đang xem. Đọc ra là `number | null`; ghi vào thì đồng thời lưu xuống
 * kho lưu trữ của zmp-sdk để lần mở app sau vẫn đúng hồ sơ.
 */
export const activePatientIdState = atom(
  (get) => get(activePatientIdBaseState),
  async (_get, set, patientId: number | null) => {
    set(activePatientIdBaseState, patientId);
    const session = await loadSession();
    if (session) {
      await saveSession({ ...session, activePatientId: patientId });
    }
  }
);

export const activeProfileState = atom(async (get) => {
  const profiles = await get(profilesState);
  const activeId = get(activePatientIdState);
  return profiles.find((p) => p.patientId === activeId) ?? profiles[0] ?? null;
});

/** Nạp lại phiên đã lưu khi mở app. `Layout` gọi đúng một lần lúc mount. */
export const hydrateSessionState = atom(null, async (_get, set) => {
  const session = await loadSession();
  setSessionToken(session?.token ?? null);
  set(activePatientIdBaseState, session?.activePatientId ?? null);
  set(profilesState);
});

/** Ghi phiên xuống kho lưu trữ sau khi liên kết thành công. */
export const applyLinkState = atom(
  null,
  async (_get, set, payload: { token: string; patientId: number }) => {
    setSessionToken(payload.token);
    await saveSession({ token: payload.token, activePatientId: payload.patientId });
    set(activePatientIdBaseState, payload.patientId);
    set(profilesState);
  }
);

export const unlinkState = atom(null, async (_get, set, patientId: number) => {
  await api.unlink(patientId);
  await clearSession();
  setSessionToken(null);
  set(activePatientIdBaseState, null);
  set(profilesState);
});

/**
 * Danh mục
 */
export const departmentsState = atom(async () => api.departments());

/**
 * Đặt lịch
 */
export const slotsState = atomFamily(
  ({ departmentId, date }: { departmentId: number; date: string }) =>
    atom(async () => api.slots({ departmentId, date })),
  (a, b) => a.departmentId === b.departmentId && a.date === b.date
);

export const bookingFormState = atomWithReset<{
  departmentId?: number;
  date?: string;
  session?: Session;
  reason?: string;
}>({});

/**
 * Lịch hẹn, số thứ tự, hoá đơn, thông báo — tất cả khoá theo hồ sơ
 */
export const appointmentsState = atomFamily((patientId: number) =>
  atomWithRefresh(async () => api.appointments({ patientId }))
);

export const appointmentByIdState = atomFamily((id: number) =>
  atomWithRefresh(async () => api.appointment(id))
);

export const queueState = atomFamily((patientId: number) =>
  atomWithRefresh(async () => api.queue({ patientId }))
);

export const invoicesState = atomFamily((patientId: number) =>
  atom(async () => api.invoices({ patientId }))
);

export const notificationsState = atomFamily((patientId: number) =>
  atom(async () => api.notifications({ patientId }))
);

/**
 * Linh tinh
 */
export const customTitleState = atom("");
```

- [ ] **Step 4: Chạy test để chắc chắn nó qua**

Run: `npm test`
Expected: PASS — 2 test mới

- [ ] **Step 5: Commit**

```bash
git add src/state.ts src/services/__tests__/state.test.ts
git commit -m "Viết lại state.ts trên tầng dữ liệu người bệnh"
```

---

### Task 7: Dọn template và dựng khung định tuyến

**Files:**
- Rewrite: `src/router.tsx`
- Modify: `src/components/footer.tsx` (`NAV_ITEMS`)
- Modify: `src/components/layout.tsx` (nạp lại phiên lúc mount)
- Modify: `app-config.json` (`app.title`, `template.oaID`)
- Modify: `src/css/app.scss` (`--primary`, nếu có bộ nhận diện riêng)
- Delete: `src/pages/ask/`, `src/pages/feedback/`, `src/pages/news/`, `src/pages/explore/`, `src/pages/categories/`, `src/pages/search/`, `src/pages/services/`, `src/pages/detail/`, `src/pages/schedule/`, `src/pages/invoices/`, `src/pages/profile/`
- Delete: `src/components/form/doctor-selector.tsx`, `src/components/form/date-time-picker.tsx`, `src/components/form/symptom-inquiry.tsx`, `src/components/form/department-picker.tsx`, `src/components/form/fab-form.tsx`, `src/components/form/textarea-with-image-upload.tsx`, `src/components/items/`

`doctor-selector.tsx` và `date-time-picker.tsx` tham chiếu các kiểu đã bị xoá ở
Task 4 (`Doctor`, `TimeSlot`, `AvailableTimeSlots`), nên bắt buộc phải đi. Bốn tệp
còn lại chỉ được dùng bởi các trang bị xoá.
- Create: `src/pages/placeholder.tsx` (khung tạm cho các trang Task 8–11)

**Interfaces:**
- Consumes: `useRouteHandle` (`src/hooks.ts`, không đổi)
- Produces: cây route GĐ1; `PlaceholderPage({ title }: { title: string })`

Task này để lại một ứng dụng **chạy được và điều hướng được**, mọi trang còn rỗng.
Các task sau lấp từng trang một.

- [ ] **Step 1: Hỏi ba giá trị ở mục "Đầu vào cần bạn cung cấp"**

Dừng lại, hỏi người dùng `oaID`, tên hiển thị, và màu chủ đạo. **Không tự bịa
`oaID`** — sai OA thì nút chat mở nhầm tài khoản.

- [ ] **Step 2: Xoá các trang ngoài phạm vi**

```bash
git rm -r src/pages/ask src/pages/feedback src/pages/news src/pages/explore \
          src/pages/categories src/pages/search src/pages/services \
          src/pages/detail src/pages/schedule src/pages/invoices src/pages/profile
git rm src/components/form/doctor-selector.tsx \
       src/components/form/date-time-picker.tsx \
       src/components/form/symptom-inquiry.tsx \
       src/components/form/department-picker.tsx \
       src/components/form/fab-form.tsx \
       src/components/form/textarea-with-image-upload.tsx
git rm -r src/components/items
```

- [ ] **Step 3: Tạo khung trang tạm**

Tạo `src/pages/placeholder.tsx`:

```tsx
export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="p-4 text-disabled">
      Trang <span className="text-primary">{title}</span> sẽ được xây ở bước sau.
    </div>
  );
}
```

- [ ] **Step 4: Viết lại `src/router.tsx`**

```tsx
import Layout from "@/components/layout";
import { createBrowserRouter } from "react-router-dom";
import { ErrorBoundary } from "./components/error-boundary";
import NotFound from "./pages/404";
import PlaceholderPage from "./pages/placeholder";

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <Layout />,
      children: [
        { path: "/", element: <PlaceholderPage title="Trang chủ" /> },
        {
          path: "/link",
          element: <PlaceholderPage title="Liên kết tài khoản" />,
          handle: { back: true, title: "Liên kết tài khoản" },
        },
        {
          path: "/profiles",
          element: <PlaceholderPage title="Hồ sơ của tôi" />,
          handle: { back: true, title: "Hồ sơ của tôi" },
        },
        {
          path: "/booking/:step?",
          element: <PlaceholderPage title="Đặt lịch khám" />,
          handle: { back: true, title: "Đặt lịch khám" },
        },
        { path: "/appointments", element: <PlaceholderPage title="Lịch hẹn" /> },
        {
          path: "/appointments/:id",
          element: <PlaceholderPage title="Chi tiết lịch hẹn" />,
          handle: { back: true, title: "custom" },
        },
        {
          path: "/queue",
          element: <PlaceholderPage title="Số thứ tự" />,
          handle: { back: true, title: "Số thứ tự hôm nay" },
        },
        {
          path: "/invoices",
          element: <PlaceholderPage title="Hóa đơn" />,
          handle: { back: true, title: "Hóa đơn" },
        },
        {
          path: "/invoices/:id/qr",
          element: <PlaceholderPage title="Mã thanh toán" />,
          handle: { back: true, title: "Thanh toán" },
        },
        {
          path: "/notifications",
          element: <PlaceholderPage title="Thông báo" />,
          handle: { back: true, title: "Thông báo" },
        },
        { path: "*", element: <NotFound /> },
      ],
      ErrorBoundary,
    },
  ],
  { basename: getBasePath() }
);

export function getBasePath() {
  const urlParams = new URLSearchParams(window.location.search);
  const appEnv = urlParams.get("env");

  if (
    import.meta.env.PROD ||
    appEnv === "TESTING_LOCAL" ||
    appEnv === "TESTING" ||
    appEnv === "DEVELOPMENT"
  ) {
    return `/zapps/${window.APP_ID}`;
  }

  return window.BASE_PATH || "";
}

export default router;
```

- [ ] **Step 5: Sửa thanh tab dưới**

Trong `src/components/footer.tsx`, thay `NAV_ITEMS` (giữ nguyên phần còn lại của tệp):

```tsx
const NAV_ITEMS = [
  {
    name: "Trang chủ",
    path: "/",
    icon: HomeIcon,
  },
  {
    name: "Lịch hẹn",
    path: "/appointments",
    icon: ChatIcon,
  },
  {
    path: "/booking",
    icon: () => (
      <BigPlusIcon className="-mt-4 shadow-lg shadow-highlight rounded-full" />
    ),
  },
  {
    name: "Số thứ tự",
    path: "/queue",
    icon: ExploreIcon,
  },
  {
    name: "Hồ sơ",
    path: "/profiles",
    icon: ProfileIcon,
  },
];
```

- [ ] **Step 6: Nạp lại phiên khi mở app**

Trong `src/components/layout.tsx`, gọi `hydrateSessionState` đúng một lần lúc mount.
Không có bước này thì mở lại mini app sẽ mất phiên và mất hồ sơ đang chọn.

```tsx
import { useEffect } from "react";
import { useSetAtom } from "jotai";
import { hydrateSessionState } from "@/state";
import Header from "./header";
import Footer from "./footer";
import { Toaster } from "react-hot-toast";
import { ScrollRestoration } from "./scroll-restoration";
import Page from "./page";

export default function Layout() {
  const hydrate = useSetAtom(hydrateSessionState);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <div className="w-screen h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <Header />
      <Page />
      <Footer />
      <Toaster containerClassName="toast-container" position="bottom-center" />
      <ScrollRestoration />
    </div>
  );
}
```

- [ ] **Step 7: Cập nhật thương hiệu**

Đặt `app.title` và `template.oaID` trong `app-config.json` bằng giá trị lấy được ở
Step 1. Nếu người dùng có màu chủ đạo riêng, đổi `--primary` (và `--primary-gradient`,
`--highlight` cho khớp) trong `src/css/app.scss`; nếu không, giữ nguyên `#00abbb`
của template.

- [ ] **Step 8: Kiểm tra kiểu**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: sạch, không lỗi. Nếu còn lỗi, đó là tệp mồ côi tham chiếu tới trang đã
xoá — xoá nốt tệp đó.

- [ ] **Step 9: Chạy thử ứng dụng**

Mở Run panel của Zalo Mini App Extension trong VS Code, bấm **Start**. Kiểm tra:
năm tab dưới điều hướng được, mỗi trang hiện đúng chữ tạm, nút quay lại hoạt động
ở các trang có `back: true`.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "Dọn template và dựng khung định tuyến giai đoạn 1"
```

---

### Task 8: Trang liên kết tài khoản và hồ sơ

**Files:**
- Create: `src/pages/link/index.tsx`
- Create: `src/pages/profiles/index.tsx`
- Modify: `src/router.tsx` (thay hai `PlaceholderPage`)

**Interfaces:**
- Consumes: `api.link` (Task 4), `applyLinkState`, `unlinkState`, `profilesState`, `activePatientIdState` (Task 6)
- Produces: `LinkPage`, `ProfilesPage`

Thang bậc xác minh của spec §5.4: lấy token số điện thoại từ Zalo, gửi lên máy chủ;
máy chủ trả `CHALLENGE` để hỏi thêm; hỏi xong gửi lại. **Mọi lỗi hiện cùng một
thông báo** — không được để trang này thành công cụ dò xem một số điện thoại có
phải bệnh nhân của phòng khám hay không.

- [ ] **Step 1: Viết trang liên kết**

Tạo `src/pages/link/index.tsx`:

```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSetAtom } from "jotai";
import { getPhoneNumber } from "zmp-sdk";
import { Button, Input } from "zmp-ui";
import toast from "react-hot-toast";
import { api } from "@/services";
import { applyLinkState } from "@/state";

type Buoc = "BAT_DAU" | "BIRTHDATE" | "INSURANCE_LAST4";

export default function LinkPage() {
  const navigate = useNavigate();
  const applyLink = useSetAtom(applyLinkState);
  const [buoc, setBuoc] = useState<Buoc>("BAT_DAU");
  const [phoneToken, setPhoneToken] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [last4, setLast4] = useState("");
  const [dangGui, setDangGui] = useState(false);

  async function gui(token: string) {
    setDangGui(true);
    try {
      const ketQua = await api.link({
        zaloPhoneToken: token,
        birthdate: birthdate || undefined,
        insuranceLast4: last4 || undefined,
      });

      if (ketQua.outcome === "CHALLENGE") {
        setBuoc(ketQua.need);
        return;
      }

      await applyLink({
        token: ketQua.token,
        patientId: ketQua.profiles[0].patientId,
      });
      toast.success("Liên kết tài khoản thành công.");
      navigate("/", { viewTransition: true });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Thông tin không khớp. Vui lòng kiểm tra lại."
      );
    } finally {
      setDangGui(false);
    }
  }

  async function batDau() {
    try {
      const { token } = await getPhoneNumber();
      setPhoneToken(token ?? "");
      await gui(token ?? "");
    } catch {
      toast.error("Cần cho phép truy cập số điện thoại để liên kết hồ sơ.");
    }
  }

  return (
    <div className="p-4 space-y-4">
      <p className="text-sm text-disabled">
        Liên kết tài khoản Zalo với hồ sơ tại phòng khám để đặt lịch và xem số thứ
        tự. Bạn có thể liên kết nhiều hồ sơ cho người thân.
      </p>

      {buoc === "BAT_DAU" && (
        <Button fullWidth onClick={batDau} loading={dangGui}>
          Liên kết bằng số điện thoại Zalo
        </Button>
      )}

      {buoc === "BIRTHDATE" && (
        <>
          <Input
            label="Ngày sinh của người bệnh"
            placeholder="YYYY-MM-DD"
            value={birthdate}
            onChange={(e) => setBirthdate(e.target.value)}
          />
          <Button fullWidth onClick={() => gui(phoneToken)} loading={dangGui}>
            Xác nhận
          </Button>
        </>
      )}

      {buoc === "INSURANCE_LAST4" && (
        <>
          <p className="text-sm text-disabled">
            Có nhiều hồ sơ trùng thông tin. Nhập 4 số cuối thẻ BHYT của đúng hồ sơ
            bạn muốn liên kết.
          </p>
          <Input
            label="4 số cuối thẻ BHYT"
            maxLength={4}
            value={last4}
            onChange={(e) => setLast4(e.target.value)}
          />
          <Button fullWidth onClick={() => gui(phoneToken)} loading={dangGui}>
            Xác nhận
          </Button>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Viết trang hồ sơ**

Tạo `src/pages/profiles/index.tsx`:

```tsx
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useNavigate } from "react-router-dom";
import { Button } from "zmp-ui";
import toast from "react-hot-toast";
import { activePatientIdState, profilesState, unlinkState } from "@/state";
import { formatFullDate } from "@/utils/format";

export default function ProfilesPage() {
  const navigate = useNavigate();
  const profiles = useAtomValue(profilesState);
  const [activeId, setActiveId] = useAtom(activePatientIdState);
  const unlink = useSetAtom(unlinkState);

  if (profiles.length === 0) {
    return (
      <div className="p-4 space-y-4">
        <p className="text-sm text-disabled">
          Chưa có hồ sơ nào được liên kết với tài khoản này.
        </p>
        <Button fullWidth onClick={() => navigate("/link", { viewTransition: true })}>
          Liên kết hồ sơ
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {profiles.map((profile) => (
        <button
          key={profile.patientId}
          onClick={() => setActiveId(profile.patientId)}
          className={`w-full text-left p-3 rounded-xl bg-white border ${
            profile.patientId === activeId ? "border-primary" : "border-transparent"
          }`}
        >
          <div className="font-medium">{profile.fullName}</div>
          <div className="text-2xs text-disabled">
            {profile.patientCode} · {formatFullDate(new Date(profile.birthdate))}
          </div>
        </button>
      ))}

      <Button
        fullWidth
        variant="secondary"
        onClick={() => navigate("/link", { viewTransition: true })}
      >
        Liên kết thêm hồ sơ
      </Button>

      {activeId !== null && (
        <Button
          fullWidth
          variant="tertiary"
          onClick={async () => {
            await unlink(activeId);
            toast.success("Đã huỷ liên kết hồ sơ.");
          }}
        >
          Huỷ liên kết hồ sơ đang chọn
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Gắn vào router**

Trong `src/router.tsx`, thêm import và thay hai `PlaceholderPage` tương ứng:

```tsx
import LinkPage from "./pages/link";
import ProfilesPage from "./pages/profiles";
```

- [ ] **Step 4: Kiểm tra kiểu**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: sạch

- [ ] **Step 5: Chạy thử**

Start ứng dụng. Vào `/link`, bấm liên kết. Với tầng giả: lần đầu hiện ô ngày sinh,
nhập `1990-05-12` thì thành công và chuyển về trang chủ. Nhập ngày khác phải hiện
đúng thông báo "Thông tin không khớp. Vui lòng kiểm tra lại." Vào `/profiles` thấy
hai hồ sơ, chuyển qua lại được.

- [ ] **Step 6: Commit**

```bash
git add src/pages/link src/pages/profiles src/router.tsx
git commit -m "Trang liên kết tài khoản và chuyển hồ sơ người thân"
```

---

### Task 9: Luồng đặt lịch ba bước

**Files:**
- Create: `src/pages/booking/index.tsx`
- Create: `src/pages/booking/step1.tsx`
- Create: `src/pages/booking/step2.tsx`
- Create: `src/pages/booking/step3.tsx`
- Modify: `src/router.tsx`

**Interfaces:**
- Consumes: `departmentsState`, `slotsState`, `bookingFormState`, `activePatientIdState` (Task 6), `api.createAppointment` (Task 4)
- Produces: `BookingPage`

Ba bước: chọn khoa → chọn ngày và buổi → xác nhận. **Không có bước chọn bác sĩ** —
phân công bác sĩ là việc của tiếp đón (spec §3, ngoài phạm vi).

- [ ] **Step 1: Bước 1 — chọn khoa**

Tạo `src/pages/booking/step1.tsx`:

```tsx
import { useAtomValue, useSetAtom } from "jotai";
import { departmentsState, bookingFormState } from "@/state";

export default function Step1({ onNext }: { onNext: () => void }) {
  const departments = useAtomValue(departmentsState);
  const setForm = useSetAtom(bookingFormState);

  return (
    <div className="p-4 space-y-3">
      <p className="text-sm text-disabled">Chọn chuyên khoa bạn muốn khám.</p>
      {departments.map((department) => (
        <button
          key={department.id}
          className="w-full text-left p-3 rounded-xl bg-white active:scale-[0.99]"
          onClick={() => {
            setForm((form) => ({ ...form, departmentId: department.id }));
            onNext();
          }}
        >
          <div className="font-medium">{department.name}</div>
          {department.description && (
            <div className="text-2xs text-disabled">{department.description}</div>
          )}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Bước 2 — chọn ngày và buổi**

Tạo `src/pages/booking/step2.tsx`:

```tsx
import { useMemo, useState } from "react";
import { useAtom, useAtomValue } from "jotai";
import { bookingFormState, slotsState } from "@/state";
import type { Session } from "@/types";

function bayNgayToi(): string[] {
  const homNay = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const ngay = new Date(homNay);
    ngay.setDate(homNay.getDate() + i + 1);
    return ngay.toISOString().slice(0, 10);
  });
}

const TEN_BUOI: Record<Session, string> = { SANG: "Buổi sáng", CHIEU: "Buổi chiều" };

export default function Step2({ onNext }: { onNext: () => void }) {
  const [form, setForm] = useAtom(bookingFormState);
  const ngayList = useMemo(bayNgayToi, []);
  const [ngay, setNgay] = useState(ngayList[0]);

  const slots = useAtomValue(
    slotsState({ departmentId: form.departmentId!, date: ngay })
  );

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-2 overflow-x-auto">
        {ngayList.map((d) => (
          <button
            key={d}
            onClick={() => setNgay(d)}
            className={`shrink-0 px-3 py-2 rounded-xl text-2xs ${
              d === ngay ? "bg-primary text-white" : "bg-white text-disabled"
            }`}
          >
            {d.slice(8)}/{d.slice(5, 7)}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {slots.map((slot) => (
          <button
            key={slot.session}
            disabled={slot.remaining <= 0}
            onClick={() => {
              setForm((f) => ({ ...f, date: slot.date, session: slot.session }));
              onNext();
            }}
            className="w-full flex justify-between items-center p-3 rounded-xl bg-white disabled:opacity-50"
          >
            <span className="font-medium">{TEN_BUOI[slot.session]}</span>
            <span className="text-2xs text-disabled">
              {slot.remaining > 0 ? `Còn ${slot.remaining} chỗ` : "Hết chỗ"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Bước 3 — xác nhận**

Tạo `src/pages/booking/step3.tsx`:

```tsx
import { useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { useResetAtom } from "jotai/utils";
import { useNavigate } from "react-router-dom";
import { Button } from "zmp-ui";
import toast from "react-hot-toast";
import { api } from "@/services";
import {
  activePatientIdState,
  appointmentsState,
  bookingFormState,
  departmentsState,
} from "@/state";

const TEN_BUOI = { SANG: "Buổi sáng", CHIEU: "Buổi chiều" } as const;

export default function Step3() {
  const navigate = useNavigate();
  const form = useAtomValue(bookingFormState);
  const resetForm = useResetAtom(bookingFormState);
  const departments = useAtomValue(departmentsState);
  const patientId = useAtomValue(activePatientIdState);
  const refreshAppointments = useSetAtom(appointmentsState(patientId ?? 0));
  const [dangGui, setDangGui] = useState(false);

  const department = departments.find((d) => d.id === form.departmentId);

  async function xacNhan() {
    if (!patientId || !form.departmentId || !form.date || !form.session) {
      toast.error("Thiếu thông tin đặt lịch. Vui lòng chọn lại.");
      return;
    }
    setDangGui(true);
    try {
      const hen = await api.createAppointment({
        patientId,
        departmentId: form.departmentId,
        date: form.date,
        session: form.session,
        reason: form.reason,
      });
      refreshAppointments();
      resetForm();
      toast.success(`Đặt lịch thành công. Mã hẹn ${hen.appointmentCode}.`);
      navigate(`/appointments/${hen.id}`, { viewTransition: true });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không đặt được lịch. Vui lòng thử lại."
      );
    } finally {
      setDangGui(false);
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-xl p-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-disabled">Chuyên khoa</span>
          <span className="font-medium">{department?.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-disabled">Ngày khám</span>
          <span className="font-medium">{form.date}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-disabled">Buổi</span>
          <span className="font-medium">
            {form.session ? TEN_BUOI[form.session] : ""}
          </span>
        </div>
      </div>

      <p className="text-2xs text-disabled">
        Phòng khám sẽ phân công bác sĩ và phòng khám cụ thể khi bạn tới. Vui lòng
        mang theo thẻ BHYT.
      </p>

      <Button fullWidth onClick={xacNhan} loading={dangGui}>
        Xác nhận đặt lịch
      </Button>
    </div>
  );
}
```

- [ ] **Step 4: Trang điều phối ba bước**

Tạo `src/pages/booking/index.tsx`:

```tsx
import { useState } from "react";
import Step1 from "./step1";
import Step2 from "./step2";
import Step3 from "./step3";

export default function BookingPage() {
  const [buoc, setBuoc] = useState(1);

  if (buoc === 1) {
    return <Step1 onNext={() => setBuoc(2)} />;
  }
  if (buoc === 2) {
    return <Step2 onNext={() => setBuoc(3)} />;
  }
  return <Step3 />;
}
```

- [ ] **Step 5: Gắn vào router**

Trong `src/router.tsx`, thêm `import BookingPage from "./pages/booking";` và thay
`PlaceholderPage` ở route `/booking/:step?`.

- [ ] **Step 6: Kiểm tra kiểu**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: sạch

- [ ] **Step 7: Chạy thử**

Start ứng dụng. Liên kết trước, rồi đặt lịch: Khoa Nội hiện "Còn 6 chỗ" buổi sáng.
Đặt xong quay lại bước 2 phải thấy "Còn 5 chỗ". Đặt tới lịch thứ ba phải hiện
"Mỗi hồ sơ chỉ được giữ tối đa 2 lịch hẹn cùng lúc."

- [ ] **Step 8: Commit**

```bash
git add src/pages/booking src/router.tsx
git commit -m "Luồng đặt lịch ba bước theo khoa và buổi"
```

---

### Task 10: Lịch hẹn và số thứ tự

**Files:**
- Create: `src/pages/appointments/index.tsx`
- Create: `src/pages/appointments/detail.tsx`
- Create: `src/pages/queue/index.tsx`
- Modify: `src/router.tsx`

**Interfaces:**
- Consumes: `appointmentsState`, `appointmentByIdState`, `queueState`, `activePatientIdState`, `customTitleState` (Task 6)
- Produces: `AppointmentsPage`, `AppointmentDetailPage`, `QueuePage`

- [ ] **Step 1: Danh sách lịch hẹn**

Tạo `src/pages/appointments/index.tsx`:

```tsx
import { useAtomValue } from "jotai";
import { useNavigate } from "react-router-dom";
import { activePatientIdState, appointmentsState } from "@/state";
import type { AppointmentStatus } from "@/types";

const NHAN_TRANG_THAI: Record<AppointmentStatus, string> = {
  Scheduled: "Đã đặt",
  CheckedIn: "Đã đến",
  Completed: "Đã khám",
  Cancelled: "Đã huỷ",
  Missed: "Lỡ hẹn",
  WaitListed: "Chờ chỗ trống",
};

export default function AppointmentsPage() {
  const navigate = useNavigate();
  const patientId = useAtomValue(activePatientIdState);
  const appointments = useAtomValue(appointmentsState(patientId ?? 0));

  if (!patientId) {
    return (
      <div className="p-4 text-disabled">
        Vui lòng liên kết hồ sơ để xem lịch hẹn.
      </div>
    );
  }

  if (appointments.length === 0) {
    return <div className="p-4 text-disabled">Bạn chưa có lịch hẹn nào.</div>;
  }

  return (
    <div className="p-4 space-y-3">
      {appointments.map((hen) => (
        <button
          key={hen.id}
          onClick={() => navigate(`/appointments/${hen.id}`, { viewTransition: true })}
          className="w-full text-left p-3 rounded-xl bg-white"
        >
          <div className="flex justify-between">
            <span className="font-medium">{hen.department.name}</span>
            <span className="text-2xs text-primary">
              {NHAN_TRANG_THAI[hen.status]}
            </span>
          </div>
          <div className="text-2xs text-disabled">
            {hen.apptDate} · {hen.session === "SANG" ? "Buổi sáng" : "Buổi chiều"} ·
            Mã {hen.appointmentCode}
          </div>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Chi tiết lịch hẹn**

Tạo `src/pages/appointments/detail.tsx`:

```tsx
import { useEffect, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "zmp-ui";
import toast from "react-hot-toast";
import { api } from "@/services";
import {
  activePatientIdState,
  appointmentByIdState,
  appointmentsState,
  customTitleState,
} from "@/state";

export default function AppointmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const appointmentId = Number(id);
  const hen = useAtomValue(appointmentByIdState(appointmentId));
  const refreshHen = useSetAtom(appointmentByIdState(appointmentId));
  const patientId = useAtomValue(activePatientIdState);
  const refreshList = useSetAtom(appointmentsState(patientId ?? 0));
  const setTitle = useSetAtom(customTitleState);
  const [dangGui, setDangGui] = useState(false);

  useEffect(() => {
    setTitle(`Mã hẹn ${hen.appointmentCode}`);
    return () => setTitle("");
  }, [hen.appointmentCode, setTitle]);

  async function chay(viec: () => Promise<unknown>, thongBao: string) {
    setDangGui(true);
    try {
      await viec();
      refreshHen();
      refreshList();
      toast.success(thongBao);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Thao tác thất bại.");
    } finally {
      setDangGui(false);
    }
  }

  const conMo = hen.status === "Scheduled" || hen.status === "WaitListed";

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-xl p-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-disabled">Chuyên khoa</span>
          <span className="font-medium">{hen.department.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-disabled">Ngày khám</span>
          <span className="font-medium">{hen.apptDate}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-disabled">Buổi</span>
          <span className="font-medium">
            {hen.session === "SANG" ? "Buổi sáng" : "Buổi chiều"}
          </span>
        </div>
        {hen.prepNote && (
          <div className="text-2xs text-primary pt-2">{hen.prepNote}</div>
        )}
      </div>

      {conMo && !hen.patientConfirmed && (
        <Button
          fullWidth
          loading={dangGui}
          onClick={() =>
            chay(() => api.confirmAppointment(hen.id), "Đã xác nhận lịch hẹn.")
          }
        >
          Xác nhận sẽ đến khám
        </Button>
      )}

      {conMo && (
        <Button
          fullWidth
          variant="tertiary"
          loading={dangGui}
          onClick={async () => {
            await chay(
              () => api.cancelAppointment(hen.id, "Người bệnh huỷ từ mini app"),
              "Đã huỷ lịch hẹn."
            );
            navigate("/appointments", { viewTransition: true });
          }}
        >
          Huỷ lịch hẹn
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Trang số thứ tự**

Tạo `src/pages/queue/index.tsx`:

```tsx
import { useAtomValue } from "jotai";
import { activePatientIdState, queueState } from "@/state";

export default function QueuePage() {
  const patientId = useAtomValue(activePatientIdState);
  const queue = useAtomValue(queueState(patientId ?? 0));

  if (queue.myNumber === null) {
    return (
      <div className="p-4 text-disabled">
        Hôm nay bạn chưa có số thứ tự. Số được cấp khi bạn đến quầy tiếp đón.
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-xl p-6 text-center">
        <div className="text-2xs text-disabled">Số của bạn</div>
        <div className="text-4xl font-semibold text-primary">{queue.myNumber}</div>
      </div>

      <div className="bg-white rounded-xl p-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-disabled">Đang gọi tới số</span>
          <span className="font-medium">{queue.currentNumber ?? "—"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-disabled">Phòng khám</span>
          <span className="font-medium">{queue.roomName ?? "—"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-disabled">Ước tính còn</span>
          <span className="font-medium">
            {queue.estimatedWaitMinutes === null
              ? "—"
              : `khoảng ${queue.estimatedWaitMinutes} phút`}
          </span>
        </div>
      </div>

      <p className="text-2xs text-disabled">
        Thời gian ước tính chỉ mang tính tham khảo và có thể thay đổi khi có ca cấp cứu.
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Gắn vào router**

Thêm ba import và thay ba `PlaceholderPage` tương ứng trong `src/router.tsx`.

- [ ] **Step 5: Kiểm tra kiểu**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: sạch

- [ ] **Step 6: Chạy thử**

Start ứng dụng. Đặt một lịch, mở chi tiết: tiêu đề header phải hiện mã hẹn (đường
`title: "custom"`). Bấm xác nhận rồi bấm huỷ, danh sách phải cập nhật theo.
Trang `/queue` hiện số 27 và số đang gọi 21.

- [ ] **Step 7: Commit**

```bash
git add src/pages/appointments src/pages/queue src/router.tsx
git commit -m "Trang lịch hẹn, chi tiết lịch hẹn và số thứ tự"
```

---

### Task 11: Hoá đơn, mã thanh toán, thông báo và trang chủ

**Files:**
- Create: `src/pages/invoices/index.tsx`
- Create: `src/pages/invoices/qr.tsx`
- Create: `src/pages/notifications/index.tsx`
- Create: `src/pages/home/index.tsx`
- Modify: `src/router.tsx`
- Delete: `src/pages/placeholder.tsx`

**Interfaces:**
- Consumes: `invoicesState`, `notificationsState`, `appointmentsState`, `queueState`, `activePatientIdState` (Task 6), `api.invoiceQr` (Task 4), `formatPrice` (`src/utils/format.ts`)
- Produces: `InvoicesPage`, `InvoiceQrPage`, `NotificationsPage`, `HomePage`

Phòng khám chỉ thanh toán BHYT nên phần lớn hoá đơn sẽ có `amountDue = 0`. Trang
hoá đơn phải hiển thị đúng trường hợp đó chứ không coi là lỗi.

- [ ] **Step 1: Danh sách hoá đơn**

Tạo `src/pages/invoices/index.tsx`:

```tsx
import { useAtomValue } from "jotai";
import { useNavigate } from "react-router-dom";
import { activePatientIdState, invoicesState } from "@/state";
import { formatPrice } from "@/utils/format";

export default function InvoicesPage() {
  const navigate = useNavigate();
  const patientId = useAtomValue(activePatientIdState);
  const invoices = useAtomValue(invoicesState(patientId ?? 0));

  if (invoices.length === 0) {
    return <div className="p-4 text-disabled">Chưa có hoá đơn nào.</div>;
  }

  return (
    <div className="p-4 space-y-3">
      {invoices.map((hoaDon) => (
        <button
          key={hoaDon.id}
          disabled={hoaDon.paid || hoaDon.amountDue === 0}
          onClick={() =>
            navigate(`/invoices/${hoaDon.id}/qr`, { viewTransition: true })
          }
          className="w-full text-left p-3 rounded-xl bg-white disabled:opacity-60"
        >
          <div className="flex justify-between">
            <span className="font-medium">Khám ngày {hoaDon.visitDate}</span>
            <span className="text-2xs text-disabled">
              {hoaDon.paid
                ? "Đã thanh toán"
                : hoaDon.amountDue === 0
                  ? "BHYT chi trả toàn bộ"
                  : "Chưa thanh toán"}
            </span>
          </div>
          <div className="text-2xs text-primary">
            {formatPrice(hoaDon.amountDue)}
          </div>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Trang mã thanh toán**

Tạo `src/pages/invoices/qr.tsx`. `qrContent` là chuỗi máy chủ trả về; GĐ1 hiển thị
dạng chữ để nhân viên quầy nhập, chưa vẽ mã QR (cần thư viện, để GĐ2 cùng dịch vụ 08).

```tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "@/services";
import { formatPrice } from "@/utils/format";
import type { VietQrPayload } from "@/types";

export default function InvoiceQrPage() {
  const { id } = useParams();
  const [payload, setPayload] = useState<VietQrPayload | null>(null);
  const [loi, setLoi] = useState("");

  useEffect(() => {
    api
      .invoiceQr(Number(id))
      .then(setPayload)
      .catch((error) =>
        setLoi(error instanceof Error ? error.message : "Không lấy được mã thanh toán.")
      );
  }, [id]);

  if (loi) {
    return <div className="p-4 text-disabled">{loi}</div>;
  }
  if (!payload) {
    return <div className="p-4 text-disabled">Đang lấy mã thanh toán…</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-xl p-6 text-center space-y-2">
        <div className="text-2xs text-disabled">Số tiền cần thanh toán</div>
        <div className="text-2xl font-semibold text-primary">
          {formatPrice(payload.amount)}
        </div>
        <div className="text-2xs text-disabled break-all pt-4">
          {payload.qrContent}
        </div>
      </div>
      <p className="text-2xs text-disabled">
        Đưa mã này cho nhân viên quầy thu ngân. Mã có hiệu lực đến {payload.expiresAt}.
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Trang thông báo**

Tạo `src/pages/notifications/index.tsx`:

```tsx
import { useAtomValue } from "jotai";
import { activePatientIdState, notificationsState } from "@/state";

export default function NotificationsPage() {
  const patientId = useAtomValue(activePatientIdState);
  const notifications = useAtomValue(notificationsState(patientId ?? 0));

  if (notifications.length === 0) {
    return <div className="p-4 text-disabled">Chưa có thông báo nào.</div>;
  }

  return (
    <div className="p-4 space-y-3">
      {notifications.map((tin) => (
        <div key={tin.id} className="p-3 rounded-xl bg-white">
          <div className="font-medium">{tin.title}</div>
          <div className="text-2xs text-disabled pt-1">{tin.body}</div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Trang chủ**

Tạo `src/pages/home/index.tsx`:

```tsx
import { useAtomValue } from "jotai";
import { useNavigate } from "react-router-dom";
import { Button } from "zmp-ui";
import { activePatientIdState, appointmentsState, profilesState } from "@/state";

export default function HomePage() {
  const navigate = useNavigate();
  const profiles = useAtomValue(profilesState);
  const patientId = useAtomValue(activePatientIdState);
  const appointments = useAtomValue(appointmentsState(patientId ?? 0));

  if (profiles.length === 0) {
    return (
      <div className="p-4 space-y-4">
        <p className="text-sm text-disabled">
          Liên kết tài khoản Zalo với hồ sơ tại phòng khám để đặt lịch khám và xem
          số thứ tự.
        </p>
        <Button fullWidth onClick={() => navigate("/link", { viewTransition: true })}>
          Liên kết hồ sơ
        </Button>
      </div>
    );
  }

  const sapToi = appointments.filter((h) => h.status === "Scheduled");

  return (
    <div className="p-4 space-y-4">
      <Button fullWidth onClick={() => navigate("/booking", { viewTransition: true })}>
        Đặt lịch khám
      </Button>

      <div className="space-y-2">
        <div className="font-medium">Lịch hẹn sắp tới</div>
        {sapToi.length === 0 ? (
          <div className="text-2xs text-disabled">Bạn chưa có lịch hẹn nào.</div>
        ) : (
          sapToi.map((hen) => (
            <button
              key={hen.id}
              onClick={() =>
                navigate(`/appointments/${hen.id}`, { viewTransition: true })
              }
              className="w-full text-left p-3 rounded-xl bg-white"
            >
              <div className="font-medium">{hen.department.name}</div>
              <div className="text-2xs text-disabled">
                {hen.apptDate} ·{" "}
                {hen.session === "SANG" ? "Buổi sáng" : "Buổi chiều"}
              </div>
            </button>
          ))
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="secondary"
          onClick={() => navigate("/invoices", { viewTransition: true })}
        >
          Hoá đơn
        </Button>
        <Button
          variant="secondary"
          onClick={() => navigate("/notifications", { viewTransition: true })}
        >
          Thông báo
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Gắn vào router và xoá khung tạm**

Thay bốn `PlaceholderPage` còn lại bằng trang thật, rồi:

```bash
git rm src/pages/placeholder.tsx
```

- [ ] **Step 6: Kiểm tra kiểu**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: sạch, và không còn tham chiếu nào tới `PlaceholderPage`

- [ ] **Step 7: Chạy thử**

Start ứng dụng và đi hết một vòng: trang chủ khi chưa liên kết → liên kết → đặt
lịch → xem chi tiết → xem số thứ tự → xem hoá đơn → mở mã thanh toán → xem thông báo.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Trang chủ, hoá đơn, mã thanh toán và thông báo"
```

---

### Task 12: Rà soát tiêu chí nghiệm thu phần front-end

**Files:**
- Create: `src/services/__tests__/khong-lam-sang.test.ts`
- Modify: `docs/superpowers/specs/2026-08-22-zalo-mini-app-gd1-design.md` (đánh dấu tiêu chí đã đạt)

**Interfaces:**
- Consumes: toàn bộ tầng `services`
- Produces: —

Spec §10 có tiêu chí *"Không endpoint nào của app trả về chẩn đoán, kết quả hoặc
tên thuốc (kiểm bằng rà soát API)"*. Task này biến cuộc rà soát thủ công ấy thành
một test chạy được trên tầng front-end.

- [ ] **Step 1: Viết test rà soát**

Tạo `src/services/__tests__/khong-lam-sang.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const duongDanTypes = fileURLToPath(new URL("../../types.d.ts", import.meta.url));

/**
 * Những từ này không được xuất hiện trong hợp đồng dữ liệu của mini app.
 * Spec §6.1 quy tắc 1 và tiêu chí nghiệm thu §10.
 */
const TU_CAM = [
  "diagnosis",
  "chandoan",
  "icd",
  "labresult",
  "testresult",
  "prescription",
  "drug",
  "medicine",
  "dosage",
];

describe("hợp đồng dữ liệu không chứa nội dung lâm sàng", () => {
  it("types.d.ts không khai báo trường lâm sàng nào", () => {
    const noiDung = readFileSync(duongDanTypes, "utf8")
      .toLowerCase()
      .replace(/[^a-z]/g, "");

    for (const tu of TU_CAM) {
      expect(noiDung).not.toContain(tu);
    }
  });
});
```

- [ ] **Step 2: Chạy toàn bộ bộ test**

Run: `npm test`
Expected: PASS — toàn bộ, kể cả test mới

- [ ] **Step 3: Chạy kiểm tra kiểu lần cuối**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: sạch

- [ ] **Step 4: Đối chiếu tiêu chí §10 của spec**

Đánh dấu `[x]` những mục front-end đã đạt và ghi rõ mục nào còn chờ back-end:

| Tiêu chí | Trạng thái sau Khối B |
|---|---|
| Đặt được lịch trong ≤ 4 thao tác | đạt — Trang chủ → khoa → buổi → xác nhận |
| Xem số thứ tự và số đang gọi | đạt trên tầng giả |
| Không endpoint nào trả nội dung lâm sàng | đạt — có test tự động |
| Liên kết cần hai yếu tố | đạt trên tầng giả |
| Huỷ liên kết được và liên kết lại được | đạt trên tầng giả |
| Không nhận mã hẹn qua URL | đạt — có test tự động ở `http.test.ts` |
| Khoá sau 20 lần dò mã sai | **chờ back-end** — luật của máy chủ |
| Một tài khoản nhiều hồ sơ | đạt |
| Mọi truy cập vào `emr_access_log` | **chờ back-end** |
| Lịch `source = PATIENT_APP` không sinh XML14 | **chờ back-end** |
| Chỉ 30% công suất mở cho app | đạt trên tầng giả — máy chủ phải áp lại luật này |

- [ ] **Step 5: Cập nhật tài liệu hướng dẫn của kho mã**

`CLAUDE.md` và `.claude/rules/*` đang mô tả template ZaUI Doctor — sau Khối B thì
phần lớn nội dung đó sai. Sửa cho khớp thực tế:

| Tệp | Cần sửa |
|---|---|
| `CLAUDE.md` + `.claude/rules/project-overview.md` | Không còn là "template ZaUI Doctor" mà là mini app người bệnh của phòng khám, gắn với `emr-api` |
| `.claude/rules/routing-and-app-shell.md` | Danh sách route mới; bỏ mô tả `/service/:id`, `/categories`, `/explore`… |
| `.claude/rules/state-management.md` | `state.ts` gọi `@/services`, không còn `utils/mock.ts`; atom khoá theo `patientId` |
| `.claude/rules/zalo-sdk.md` | Bề mặt zmp-sdk nay là `getPhoneNumber`, `getStorage`/`setStorage`/`removeStorage` — không còn `chooseImage`, `openChat` |
| `.claude/rules/forms.md` | `fab-form.tsx` đã bị xoá; mô tả này không còn đúng |
| `.claude/rules/dev-workflow.md` | Thêm `npm test` và `npm run typecheck` |

- [ ] **Step 6: Commit**

```bash
git add src/services/__tests__/khong-lam-sang.test.ts docs/superpowers/specs CLAUDE.md .claude/rules
git commit -m "Rà soát tiêu chí nghiệm thu và cập nhật tài liệu kho mã"
```

---

## Sau khi xong Khối B

Ứng dụng chạy đầy đủ trên tầng giả. Việc chuyển sang back-end thật là: đặt
`VITE_USE_FAKE=false` và `VITE_API_BASE_URL=<địa chỉ emr-api>` trong `.env`.

Ba việc còn lại của GĐ1 nằm ngoài kế hoạch này:

- **Khối A / A2** (kho `eHosp`): migration `013` → `014` → `022`, router
  `/api/patient-app/*`, phiên người bệnh, rate limit, `emr_access_log`
- **Khối D** (kho `eHosp`): màn hình hàng đợi duyệt đặt sai khoa trong `emr-ui`
- **Khối E** (GĐ2): ZNS nhắc hẹn, VietQR thật, đường web dự phòng
