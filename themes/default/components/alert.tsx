/**
 * 警告や情報を伝えるアラートボックスを表示します。
 */
interface AlertProps {
  type?: "info" | "warning" | "error"; // アラートの種類（デフォルトは info）
  children: any; // 表示するメッセージ内容
}

export default function Alert({ type = "info", children }: AlertProps) {
  const colors = {
    info: { bg: "#f0f9ff", border: "#bae6fd", text: "#0369a1" },
    warning: { bg: "#fffbeb", border: "#fde68a", text: "#b45309" },
    error: { bg: "#fef2f2", border: "#fecaca", text: "#b91c1c" }
  }[type] || { bg: "#f8fafc", border: "#e2e8f0", text: "#475569" };

  return (
    <div style={{
      padding: "1rem",
      borderRadius: "0.5rem",
      border: `1px solid ${colors.border}`,
      backgroundColor: colors.bg,
      color: colors.text,
      margin: "1rem 0",
      display: "flex",
      gap: "0.5rem"
    }}>
      <span style={{ fontWeight: "bold" }}>{type.toUpperCase()}:</span>
      <div>{children}</div>
    </div>
  );
}
