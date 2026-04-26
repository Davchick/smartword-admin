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
  cancelLabel = 'Отмена',
  onCancel,
  onConfirm,
  isBusy = false,
  isConfirmDisabled = false,
}: ModalProps) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <form className="modal-card" onSubmit={onConfirm} aria-modal="true" role="dialog">
        <h3>{title}</h3>
        <div>{children}</div>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={isBusy}>
            {cancelLabel}
          </button>
          <button type="submit" className="btn btn-primary" disabled={isBusy || isConfirmDisabled}>
            {isBusy ? 'Загрузка...' : confirmLabel}
          </button>
        </div>
      </form>
    </div>
  );
}