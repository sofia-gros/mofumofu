/**
 * タイムライン表示を作成します。
 */
interface TimelineProps {
  children: any;
}

export default function Timeline({ children }: TimelineProps) {
  return (
    <ul class="el-timeline" style="list-style: none; padding: 0; margin: 1rem 0;">
      {children}
    </ul>
  );
}
