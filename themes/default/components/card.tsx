/**
 * 汎用的なカードコンポーネントです。
 */
interface CardProps {
  header?: string;
  shadow?: "always" | "hover" | "never";
  children: any;
}

export default function Card({ header, shadow = "always", children }: CardProps) {
  return (
    <div class={`el-card is-${shadow}-shadow`} style="margin: 1rem 0;">
      {header && (
        <div class="el-card__header">
          <div style="font-weight: bold;">{header}</div>
        </div>
      )}
      <div class="el-card__body">
        {children}
      </div>
    </div>
  );
}
