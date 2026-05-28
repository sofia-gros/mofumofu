/** @jsxImportSource ../../../.mofuri/core */
import { jsx } from "../../../.mofuri/core/jsx-runtime";

interface ToolbarProps {
  children: any;
}

export default function Toolbar({ children }: ToolbarProps) {
  return (
    <div class="mofuri-toolbar">
      {children}
      <style>{`
        .mofuri-toolbar { background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 0.5rem; display: flex; gap: 0.25rem; flex-wrap: wrap; align-items: center; }
      `}</style>
    </div>
  );
}
