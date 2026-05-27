/**
 * ステップ（手順）表示の親コンテナです。
 */
interface StepsProps {
  active: number;
  children: any;
}

export default function Steps({ active, children }: StepsProps) {
  return (
    <div class="el-steps el-steps--horizontal" style="display: flex; margin: 1.5rem 0;">
      {children}
    </div>
  );
}
