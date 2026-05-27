/**
 * 行レイアウトを作成します（Flexboxベース）。
 */
interface RowProps {
  gutter?: number; // カラム間の間隔
  justify?: "start" | "end" | "center" | "space-around" | "space-between";
  align?: "top" | "middle" | "bottom";
  children: any;
}

export default function Row({ gutter = 0, justify = "start", align = "top", children }: RowProps) {
  const style = `display: flex; flex-wrap: wrap; margin-left: -${gutter / 2}px; margin-right: -${gutter / 2}px; justify-content: ${justify}; align-items: ${align === 'middle' ? 'center' : align === 'bottom' ? 'flex-end' : 'flex-start'};`;
  return (
    <div class="el-row" style={style}>
      {children}
    </div>
  );
}
