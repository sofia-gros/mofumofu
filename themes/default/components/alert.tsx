/**
 * 警告や情報を伝えるアラートボックスを表示します。
 */
interface AlertProps {
  type?: "info" | "warning" | "error" | "success"; // アラートの種類
  children: any; // 表示するメッセージ内容
}

export default function Alert({ type = "info", children }: AlertProps) {
  return (
    <div class={`el-alert el-alert--${type} is-light`} role="alert" style="margin: 1rem 0;">
      <div class="el-alert__content">
        <span class="el-alert__title" style="font-weight: bold; margin-right: 8px;">{type.toUpperCase()}:</span>
        <span class="el-alert__description">{children}</span>
      </div>
    </div>
  );
}
