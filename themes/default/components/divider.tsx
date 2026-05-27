/**
 * 区切り線を表示します。
 */
interface DividerProps {
  contentPosition?: "left" | "center" | "right";
  children?: any;
}

export default function Divider({ contentPosition = "center", children }: DividerProps) {
  if (!children) {
    return <div class="el-divider el-divider--horizontal" style="display: block; height: 1px; width: 100%; margin: 24px 0; background-color: #dcdfe6; position: relative;"></div>;
  }
  
  const textStyle = `position: absolute; background-color: #fff; padding: 0 20px; font-weight: 500; color: #303133; font-size: 14px; transform: translateY(-50%); ${
    contentPosition === "left" ? "left: 20px;" : contentPosition === "right" ? "right: 20px;" : "left: 50%; transform: translateX(-50%) translateY(-50%);"
  }`;

  return (
    <div class="el-divider el-divider--horizontal" style="display: block; height: 1px; width: 100%; margin: 24px 0; background-color: #dcdfe6; position: relative;">
      <div class="el-divider__text" style={textStyle}>
        {children}
      </div>
    </div>
  );
}
