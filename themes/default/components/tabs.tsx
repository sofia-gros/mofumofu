/** @jsxImportSource ../../../.mofuri/core */
import { jsx } from "../../../.mofuri/core/jsx-runtime";

interface TabProps {
  items: { label: string; id: string; active?: boolean }[];
  onSelect: (id: string) => void;
}

export default function Tabs({ items, onSelect }: TabProps) {
  return (
    <div class="mofuri-tabs">
      {items.map((item) => (
        <button
          class={`mofuri-tab-item ${item.active ? 'active' : ''}`}
          onClick={() => onSelect(item.id)}
        >
          {item.label}
        </button>
      ))}
      <style>{`
        .mofuri-tabs { display: flex; gap: 1rem; border-bottom: 1px solid #e2e8f0; }
        .mofuri-tab-item { cursor: pointer; padding: 0.5rem 0; border: none; background: none; font-weight: 600; color: #64748b; font-size: 0.875rem; border-bottom: 2px solid transparent; }
        .mofuri-tab-item.active { color: #f26; border-bottom-color: #f26; }
      `}</style>
    </div>
  );
}
