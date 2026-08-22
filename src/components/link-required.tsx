import { useNavigate } from "react-router-dom";
import { Button } from "zmp-ui";

/**
 * Hiện khi người dùng chưa liên kết hồ sơ nào. Trang phải rẽ vào đây thay vì
 * đi hỏi dữ liệu của một mã bệnh nhân không tồn tại.
 */
export default function LinkRequired({ loiNhan }: { loiNhan: string }) {
  const navigate = useNavigate();

  return (
    <div className="p-4 space-y-4">
      <p className="text-sm text-disabled">{loiNhan}</p>
      <Button
        fullWidth
        onClick={() => navigate("/link", { viewTransition: true })}
      >
        Liên kết hồ sơ
      </Button>
    </div>
  );
}
