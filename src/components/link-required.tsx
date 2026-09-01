import { ShieldIcon } from "./icons";
import { EmptyState } from "./ui";

/**
 * Hiện khi người dùng chưa liên kết hồ sơ nào. Trang phải rẽ vào đây thay vì
 * đi hỏi dữ liệu của một mã bệnh nhân không tồn tại.
 */
export default function LinkRequired({ message }: { message: string }) {
  return (
    <EmptyState
      icon={ShieldIcon}
      title="Chưa liên kết hồ sơ"
      hint={message}
      actionLabel="Liên kết hồ sơ"
      actionTo="/link"
    />
  );
}
