/**
 * 列レイアウトを作成します（24カラム制）。
 */
interface ColProps {
  span?: number; // 24カラム中の幅（デフォルト24）
  offset?: number; // 左側のオフセット
  children: any;
}

export default function Col({ span = 24, offset = 0, children }: ColProps) {
  const width = (span / 24) * 100;
  const marginLeft = (offset / 24) * 100;
  const style = `width: ${width}%; margin-left: ${marginLeft}%; box-sizing: border-box; padding: 0 10px;`;
  return (
    <div class="el-col" style={style}>
      {children}
    </div>
  );
}
