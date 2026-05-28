/** @jsxImportSource ../../../.mofuri/core */
import { jsx } from "../../../.mofuri/core/jsx-runtime";


interface ModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: any;
}

export default function Modal({ title, isOpen, onClose, children }: ModalProps) {
  if (!isOpen) return null;
  return (
    <div class="mofuri-modal-overlay">
      <div class="mofuri-modal">
        <header>
          <h3>{title}</h3>
          <button onClick={onClose}>×</button>
        </header>
        <div class="content">{children}</div>
      </div>
      <style>{`
        .mofuri-modal-overlay { position: fixed; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,0.5); display: flex; align-items:center; justify-content:center; }
        .mofuri-modal { background: white; border-radius: 0.75rem; padding: 1.5rem; width: 400px; }
        .mofuri-modal header { display: flex; justify-content: space-between; align-items:center; margin-bottom: 1rem; }
      `}</style>
    </div>
  );
}
