/**
 * ステップの各項目を定義します。
 */
interface StepItemProps {
  title: string;
  description?: string;
}

export default function StepItem({ title, description }: StepItemProps) {
  return (
    <div class="el-step is-horizontal" style="flex-basis: 50%; margin-right: 0px;">
      <div class="el-step__head" style="position: relative; width: 100%;">
        <div class="el-step__line" style="position: absolute; border-top: 2px solid #e4e7ed; top: 11px; left: 0; right: 0; margin-right: 0px;"></div>
        <div class="el-step__icon is-text" style="width: 24px; height: 24px; font-size: 14px; box-sizing: border-box; background: #fff; transition: .15s ease-out; border-radius: 50%; border: 2px solid #e4e7ed; display: flex; justify-content: center; align-items: center; color: #c0c4cc; z-index: 1; position: relative;">
          <div class="el-step__icon-inner"></div>
        </div>
      </div>
      <div class="el-step__main" style="white-space: normal; text-align: left;">
        <div class="el-step__title" style="font-size: 16px; line-height: 38px; color: #c0c4cc; font-weight: bold;">{title}</div>
        <div class="el-step__description" style="padding-right: 10%; margin-top: -10px; font-size: 12px; line-height: 20px; font-weight: 400; color: #c0c4cc;">{description}</div>
      </div>
    </div>
  );
}
