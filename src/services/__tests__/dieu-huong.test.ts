import { describe, it, expect } from "vitest";
import routerSource from "../../router.tsx?raw";
import footerSource from "../../components/footer.tsx?raw";
import homeSource from "../../pages/home/index.tsx?raw";
import stateSource from "../../state.ts?raw";

/*
 * Ngày 03/09/2026 ứng dụng KHÔNG MỞ ĐƯỢC với mọi người bệnh đã liên kết.
 *
 * `emr-api` rút `GET /patient-app/invoices`; máy khách không đổi. Trang chủ đọc
 * `invoicesState` vô điều kiện, `ApiError` nổi lên trong lúc render, và
 * `ErrorBoundary` gắn ở route GỐC — cùng route mang `element: <Layout/>` — thay
 * luôn cả Layout. Header và thanh tab biến mất, bảy tuyến còn lại vẫn chạy tốt
 * mà không ai tới được.
 *
 * Không có bộ thử nào cho các trang (kho không cài `@testing-library/react`
 * lẫn `jsdom`), nên tệp này canh chừng bằng mã nguồn: một tuyến chết không được
 * nằm trên đường điều hướng, và mỗi màn hình phải có vách ngăn riêng.
 */

/*
 * `lib` của tsconfig dừng ở es2017 (browserslist nhắm Chrome 49 / iOS 9.3), nên
 * không có `String.matchAll` — gom bằng vòng `exec` thay vì nới `lib` ra chỉ để
 * viết cho gọn một tệp thử.
 */
function gom(source: string, pattern: RegExp): string[] {
  const found: string[] = [];
  let match = pattern.exec(source);
  while (match !== null) {
    found.push(match[1]);
    match = pattern.exec(source);
  }
  return found;
}

/**
 * Mọi `path:` khai trong `router.tsx`, kèm dạng đã bỏ tham số tuỳ chọn ở cuối:
 * `/booking/:step?` khớp cả đường dẫn `/booking` mà thanh điều hướng dùng.
 */
function routePaths(): Set<string> {
  const paths = new Set<string>();
  for (const path of gom(routerSource, /path:\s*"([^"]+)"/g)) {
    paths.add(path);
    paths.add(path.replace(/(\/:[^/]+\?)+$/, ""));
  }
  return paths;
}

/** Mọi `path:` khai trong `NAV_ITEMS` của thanh tab. */
function navPaths(): string[] {
  return gom(footerSource, /path:\s*"([^"]+)"/g);
}

/** Mọi `to:` khai trong `QUICK_ACTIONS` của Trang chủ. */
function quickActionPaths(): string[] {
  return gom(homeSource, /to:\s*"([^"]+)"/g);
}

describe("thanh điều hướng chỉ dẫn tới tuyến có thật", () => {
  it("mỗi mục của thanh tab là một route đã đăng ký", () => {
    const routes = routePaths();
    const nav = navPaths();

    expect(nav.length).toBeGreaterThan(0);
    for (const path of nav) {
      expect(
        routes,
        `thanh tab dẫn tới "${path}" mà router không có`,
      ).toContain(path);
    }
  });

  it("mỗi ô thao tác nhanh của Trang chủ là một route đã đăng ký", () => {
    const routes = routePaths();
    const actions = quickActionPaths();

    expect(actions.length).toBeGreaterThan(0);
    for (const path of actions) {
      expect(
        routes,
        `thao tác nhanh dẫn tới "${path}" mà router không có`,
      ).toContain(path);
    }
  });

  /*
   * Danh sách này là hợp đồng ngược: tuyến nào máy chủ đã rút thì máy khách
   * không được đặt lên đường điều hướng chính. Tuyến trở lại thì xoá khỏi đây
   * cùng lúc với việc dựng lại màn hình.
   */
  const TUYEN_DA_RUT = ["/invoices"];

  it("không tuyến nào đã bị rút còn nằm trên thanh tab hay thao tác nhanh", () => {
    const treoLen = [...navPaths(), ...quickActionPaths()];

    for (const path of TUYEN_DA_RUT) {
      expect(treoLen, `"${path}" đã bị rút ở máy chủ`).not.toContain(path);
    }
  });
});

describe("một tuyến hỏng chỉ được hạ một màn hình", () => {
  it("mỗi route con có ErrorBoundary riêng, không chỉ một cái ở route gốc", () => {
    expect(routerSource).toMatch(
      /CHILD_ROUTES\.map\([\s\S]{0,120}ErrorBoundary:\s*RouteError/,
    );
  });

  it("Trang chủ bọc từng thẻ bằng vách ngăn thay vì đọc atom trần", () => {
    expect(homeSource).toContain("SilentBoundary");
  });

  it("Trang chủ không còn đọc atom của tuyến đã bị rút", () => {
    expect(homeSource).not.toMatch(/useAtomValue\(\s*invoicesState/);
    expect(stateSource).not.toMatch(/export const invoicesState/);
  });
});
