/**
 * 基本的なボタンコンポーネントです。
 */
export default function Button({ children, onClick, className = "", variant = "primary" }: any) {
  const styles: any = {
    primary: { bg: "#0f172a", text: "white", border: "transparent" },
    secondary: { bg: "white", text: "#475569", border: "#e2e8f0" },
    outline: { bg: "transparent", text: "#f26", border: "#fecdd3" }
  };
  
  const s = styles[variant] || styles.primary;

  return (
    <button 
      onClick={onClick}
      style={{
        padding: "0.5rem 1rem",
        borderRadius: "0.375rem",
        border: `1px solid ${s.border}`,
        backgroundColor: s.bg,
        color: s.text,
        fontWeight: "600",
        fontSize: "0.875rem",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        transition: "all 0.2s"
      }}
      className={className}
    >
      {children}
    </button>
  );
}
