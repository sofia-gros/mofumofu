/**
 * タイムラインの各項目を定義します。
 */
interface TimelineItemProps {
  timestamp: string;
  type?: "primary" | "success" | "warning" | "danger" | "info";
  children: any;
}

export default function TimelineItem({ timestamp, type = "primary", children }: TimelineItemProps) {
  return (
    <li class="el-timeline-item" style="position: relative; padding-bottom: 20px;">
      <div class="el-timeline-item__tail" style="position: absolute; left: 4px; top: 0; height: 100%; border-left: 2px solid #e4e7ed;"></div>
      <div class={`el-timeline-item__node el-timeline-item__node--normal el-timeline-item__node--${type}`} style="position: absolute; background-color: #e4e7ed; border-radius: 50%; display: flex; justify-content: center; align-items: center; left: -1px; width: 12px; height: 12px; z-index: 1;"></div>
      <div class="el-timeline-item__wrapper" style="padding-left: 28px; top: -3px; position: relative;">
        <div class="el-timeline-item__timestamp is-top" style="color: #909399; line-height: 1; font-size: 13px; margin-bottom: 8px; padding-top: 4px;">
          {timestamp}
        </div>
        <div class="el-timeline-item__content" style="color: #303133; font-size: 14px;">
          {children}
        </div>
      </div>
    </li>
  );
}
