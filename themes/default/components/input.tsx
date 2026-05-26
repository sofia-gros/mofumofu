/**
 * 基本的な入力フィールドコンポーネントです。
 */
export default function Input({ label, value, onChange, placeholder = "", type = "text" }: any) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      {label && <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#64748b", marginBottom: "0.375rem", textTransform: "uppercase" }}>{label}</label>}
      <input 
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "0.5rem 0.75rem",
          borderRadius: "0.375rem",
          border: "1px solid #e2e8f0",
          fontSize: "0.875rem",
          outline: "none",
          transition: "border-color 0.2s"
        }}
      />
    </div>
  );
}
