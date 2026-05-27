/**
 * タグ（ラベル）を表示します。
 */
interface TagProps {
  type?: "primary" | "success" | "info" | "warning" | "danger";
  effect?: "dark" | "light" | "plain";
  children: any;
}

export default function Tag({ type = "primary", effect = "light", children }: TagProps) {
  return (
    <span class={`el-tag el-tag--${type} el-tag--${effect}`} style="margin-right: 5px;">
      {children}
    </span>
  );
}
