import { Dialog, DialogActionsBar } from '@progress/kendo-react-dialogs';
import { Button } from '@progress/kendo-react-buttons';

interface ConfirmDialogProps {
  visible: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  visible,
  title = 'Confirm',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!visible) return null;

  return (
    <Dialog title={title} onClose={onCancel} width={420}>
      <p style={{ margin: '16px 0', color: 'var(--color-gray-700)' }}>{message}</p>
      <DialogActionsBar>
        <Button onClick={onCancel}>{cancelText}</Button>
        <Button
          themeColor={destructive ? 'error' : 'primary'}
          onClick={onConfirm}
        >
          {confirmText}
        </Button>
      </DialogActionsBar>
    </Dialog>
  );
}
