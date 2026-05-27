/**
 * バッジ（通知数など）を表示します。
 */
interface BadgeProps {
  value: string | number;
  type?: "primary" | "success" | "warning" | "danger" | "info";
  children: any;
}

export default function Badge({ value, type = "danger", children }: BadgeProps) {
  return (
    <div class="el-badge" style="position: relative; display: inline-block; vertical-align: middle;">
      {children}
      <sup class={`el-badge__content el-badge__content--${type} is-fixed`}>
        {value}
      </sup>
    </div>
  );
}
