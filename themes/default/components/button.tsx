/**
 * 標準的なボタンコンポーネントです。
 */
interface ButtonProps {
  type?: "primary" | "success" | "warning" | "danger" | "info";
  size?: "large" | "default" | "small";
  children: any;
  onclick?: string;
}

export default function Button({ type = "primary", size = "default", children, onclick }: ButtonProps) {
  return (
    <button 
      class={`el-button el-button--${type} el-button--${size}`}
      onclick={onclick}
    >
      <span>{children}</span>
    </button>
  );
}
