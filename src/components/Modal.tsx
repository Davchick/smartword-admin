import { FormEvent, ReactNode } from 'react';

type ModalProps = {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onCancel: () => void;
  onConfirm: (event: FormEvent) => void;
  isBusy?: boolean;
  isConfirmDisabled?: boolean;
};

export function Modal({
  title,
  children,
  confirmLabel,
  cancelLabel = 'Cancel',
  onCancel,
  onConfirm,
  isBusy = false,
  isConfirmDisabled = false,
}: ModalProps) {
  return (
    <div className="modal-backdrop" role="presentation">
      <form className="modal-card" onSubmit={onConfirm} aria-modal="true" role="dialog">
        <h3>{title}</h3>
        <div className="modal-content">{children}</div>
        <div className="row">
          <button type="button" className="ghost" onClick={onCancel} disabled={isBusy}>
            {cancelLabel}
          </button>
          <button type="submit" disabled={isBusy || isConfirmDisabled}>
            {isBusy ? 'Working...' : confirmLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
