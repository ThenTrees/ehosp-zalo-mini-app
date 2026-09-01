import { Component, ReactNode } from "react";

/**
 * Nuốt lỗi của một nhánh trang trí và hiện bản dự phòng.
 *
 * Header nằm ngoài `ErrorBoundary` của route, nên trước đây một lỗi mạng trong
 * chuông thông báo sẽ nổi lên tận RouterProvider, rơi vào trang 404 và đá người
 * dùng lùi một bước lịch sử. Cái chấm đỏ đếm thông báo không đáng để đánh đổi
 * cả màn hình.
 */
export default class SilentBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { error: boolean }
> {
  state = { error: false };

  static getDerivedStateFromError() {
    return { error: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("Nhánh phụ lỗi, đã bỏ qua:", error);
  }

  render() {
    return this.state.error ? (this.props.fallback ?? null) : this.props.children;
  }
}
